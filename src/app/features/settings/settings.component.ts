import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ElectronService } from '../../core/electron.service';
import { DEFAULT_POT_SIZES } from '../../core/models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule],
  templateUrl: './settings.component.html',
})
export class SettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private electron = inject(ElectronService);

  readonly dbPath = signal('');
  busy = false;
  lastMessage = '';

  potSizesBusy = false;
  potSizesMessage = '';

  potSizesForm = this.fb.group({
    cup_liters: [DEFAULT_POT_SIZES.cup_liters, [Validators.required, Validators.min(0.1)]],
    intermediate_liters: [DEFAULT_POT_SIZES.intermediate_liters, [Validators.required, Validators.min(0.1)]],
    final_liters: [DEFAULT_POT_SIZES.final_liters, [Validators.required, Validators.min(0.1)]],
  });

  ngOnInit(): void {
    this.loadPath();
    this.loadPotSizes();
  }

  async loadPotSizes(): Promise<void> {
    const sizes = await this.electron.api.settings.getPotSizes();
    this.potSizesForm.setValue(sizes);
  }

  async savePotSizes(): Promise<void> {
    if (this.potSizesForm.invalid) return;
    this.potSizesBusy = true;
    this.potSizesMessage = '';
    try {
      await this.electron.api.settings.setPotSizes(this.potSizesForm.getRawValue());
      this.potSizesMessage = 'Tamanhos de vaso salvos com sucesso.';
    } finally {
      this.potSizesBusy = false;
    }
  }

  async loadPath(): Promise<void> {
    this.dbPath.set(await this.electron.api.backup.getPath());
  }

  async exportBackup(): Promise<void> {
    this.busy = true;
    this.lastMessage = '';
    try {
      const savedPath = await this.electron.api.backup.export();
      this.lastMessage = savedPath ? `Backup salvo em: ${savedPath}` : 'Exportação cancelada.';
    } finally {
      this.busy = false;
    }
  }

  async importBackup(): Promise<void> {
    if (
      !confirm(
        'Restaurar um backup substituirá TODOS os dados atuais pelos dados do arquivo selecionado. A aplicação será reiniciada. Deseja continuar?',
      )
    ) {
      return;
    }
    this.busy = true;
    try {
      await this.electron.api.backup.import();
      // A aplicação é reiniciada pelo processo principal após a importação.
    } finally {
      this.busy = false;
    }
  }
}
