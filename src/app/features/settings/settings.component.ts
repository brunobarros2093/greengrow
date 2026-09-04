import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ElectronService } from '../../core/electron.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './settings.component.html',
})
export class SettingsComponent implements OnInit {
  private electron = inject(ElectronService);

  readonly dbPath = signal('');
  busy = false;
  lastMessage = '';

  ngOnInit(): void {
    this.loadPath();
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
