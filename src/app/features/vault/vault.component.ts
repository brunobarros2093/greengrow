import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { ElectronService } from '../../core/electron.service';
import { LegalVaultDocument, VAULT_CATEGORIES } from '../../core/models';

@Component({
  selector: 'app-vault',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatExpansionModule,
    MatChipsModule,
  ],
  templateUrl: './vault.component.html',
})
export class VaultComponent implements OnInit {
  private fb = inject(FormBuilder);
  private electron = inject(ElectronService);

  readonly documents = signal<LegalVaultDocument[]>([]);
  readonly categories = VAULT_CATEGORIES;
  readonly categoryFilter = signal<string | null>(null);
  busy = false;

  form = this.fb.group({
    title: [''],
    category: ['hc_preventivo', Validators.required],
    notes: [''],
  });

  ngOnInit(): void {
    this.reload();
  }

  async reload(): Promise<void> {
    this.documents.set(await this.electron.api.vault.list());
  }

  get filteredDocuments(): LegalVaultDocument[] {
    const filter = this.categoryFilter();
    const docs = this.documents();
    return filter ? docs.filter((d) => d.category === filter) : docs;
  }

  async upload(): Promise<void> {
    if (this.form.invalid) return;
    this.busy = true;
    try {
      const created = await this.electron.api.vault.uploadAndCreate(this.form.getRawValue());
      if (created) {
        this.form.reset({ title: '', category: 'hc_preventivo', notes: '' });
        await this.reload();
      }
    } finally {
      this.busy = false;
    }
  }

  async openFile(id: string): Promise<void> {
    await this.electron.api.vault.openFile(id);
  }

  async remove(id: string): Promise<void> {
    if (!confirm('Remover permanentemente este documento do cofre legal?')) return;
    await this.electron.api.vault.remove(id);
    await this.reload();
  }

  categoryLabel(value: string): string {
    return this.categories.find((c) => c.value === value)?.label ?? value;
  }
}
