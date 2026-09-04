import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { ElectronService } from '../../core/electron.service';
import { GROW_TYPES, Grow } from '../../core/models';

@Component({
  selector: 'app-grows-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatExpansionModule,
  ],
  templateUrl: './grows-list.component.html',
})
export class GrowsListComponent implements OnInit {
  private fb = inject(FormBuilder);
  private electron = inject(ElectronService);

  readonly grows = signal<Grow[]>([]);
  readonly growTypes = GROW_TYPES;
  editingId: string | null = null;

  form = this.fb.group({
    name: ['', Validators.required],
    type: ['estufa_modular', Validators.required],
    width_m: [null as number | null],
    length_m: [null as number | null],
    height_m: [null as number | null],
    lighting_watts: [null as number | null],
  });

  ngOnInit(): void {
    this.reload();
  }

  async reload(): Promise<void> {
    this.grows.set(await this.electron.api.grows.list());
  }

  edit(grow: Grow): void {
    this.editingId = grow.id;
    this.form.setValue({
      name: grow.name,
      type: grow.type,
      width_m: grow.width_m,
      length_m: grow.length_m,
      height_m: grow.height_m,
      lighting_watts: grow.lighting_watts,
    });
  }

  cancelEdit(): void {
    this.editingId = null;
    this.form.reset({ name: '', type: 'estufa_modular', width_m: null, length_m: null, height_m: null, lighting_watts: null });
  }

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    if (this.editingId) {
      await this.electron.api.grows.update(this.editingId, value);
    } else {
      await this.electron.api.grows.create(value);
    }
    this.cancelEdit();
    await this.reload();
  }

  async remove(id: string, event: Event): Promise<void> {
    event.stopPropagation();
    event.preventDefault();
    if (!confirm('Remover este Grow e todos os ciclos/plantas vinculados?')) return;
    await this.electron.api.grows.remove(id);
    await this.reload();
  }

  typeLabel(value: string): string {
    return this.growTypes.find((t) => t.value === value)?.label ?? value;
  }
}
