import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { ElectronService } from '../../core/electron.service';
import { INPUT_CATEGORIES, INPUT_UNITS, InputItem } from '../../core/models';

@Component({
  selector: 'app-inputs',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatExpansionModule,
  ],
  templateUrl: './inputs.component.html',
})
export class InputsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private electron = inject(ElectronService);

  readonly items = signal<InputItem[]>([]);
  readonly categories = INPUT_CATEGORIES;
  readonly units = INPUT_UNITS;
  readonly displayedColumns = ['name', 'category', 'quantity', 'min_quantity', 'actions'];
  editingId: string | null = null;

  form = this.fb.group({
    name: ['', Validators.required],
    category: ['organico', Validators.required],
    unit: ['kg', Validators.required],
    quantity: [0, Validators.required],
    min_quantity: [0],
    notes: [''],
  });

  ngOnInit(): void {
    this.reload();
  }

  async reload(): Promise<void> {
    this.items.set(await this.electron.api.inputs.list());
  }

  edit(item: InputItem): void {
    this.editingId = item.id;
    this.form.setValue({
      name: item.name,
      category: item.category,
      unit: item.unit,
      quantity: item.quantity,
      min_quantity: item.min_quantity ?? 0,
      notes: item.notes ?? '',
    });
  }

  cancelEdit(): void {
    this.editingId = null;
    this.form.reset({ name: '', category: 'organico', unit: 'kg', quantity: 0, min_quantity: 0, notes: '' });
  }

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    if (this.editingId) {
      await this.electron.api.inputs.update(this.editingId, value);
    } else {
      await this.electron.api.inputs.create(value);
    }
    this.cancelEdit();
    await this.reload();
  }

  async adjust(id: string, delta: number): Promise<void> {
    await this.electron.api.inputs.adjustQuantity(id, delta);
    await this.reload();
  }

  async remove(id: string): Promise<void> {
    if (!confirm('Remover este insumo do estoque?')) return;
    await this.electron.api.inputs.remove(id);
    await this.reload();
  }

  categoryLabel(value: string): string {
    return this.categories.find((c) => c.value === value)?.label ?? value;
  }

  isLow(item: InputItem): boolean {
    return item.min_quantity != null && item.quantity <= item.min_quantity;
  }
}
