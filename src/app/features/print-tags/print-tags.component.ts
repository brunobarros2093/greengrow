import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ElectronService } from '../../core/electron.service';
import { Cycle, Plant } from '../../core/models';

@Component({
  selector: 'app-print-tags',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatCheckboxModule],
  templateUrl: './print-tags.component.html',
  styleUrl: './print-tags.component.scss',
})
export class PrintTagsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private electron = inject(ElectronService);

  readonly cycle = signal<Cycle | null>(null);
  readonly plants = signal<Plant[]>([]);
  readonly selectedIds = signal<Set<string>>(new Set());

  readonly selectedPlants = computed(() => this.plants().filter((p) => this.selectedIds().has(p.id)));
  readonly allSelected = computed(() => this.plants().length > 0 && this.selectedIds().size === this.plants().length);

  growId = '';
  cycleId = '';

  ngOnInit(): void {
    this.growId = this.route.snapshot.paramMap.get('growId')!;
    this.cycleId = this.route.snapshot.paramMap.get('cycleId')!;
    this.reload();
  }

  async reload(): Promise<void> {
    this.cycle.set(await this.electron.api.cycles.get(this.cycleId));
    const plants: Plant[] = await this.electron.api.plants.listByCycle(this.cycleId);
    this.plants.set(plants);
    this.selectedIds.set(new Set(plants.map((p) => p.id)));
  }

  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  toggle(id: string): void {
    this.selectedIds.update((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  toggleSelectAll(): void {
    this.selectedIds.set(this.allSelected() ? new Set() : new Set(this.plants().map((p) => p.id)));
  }

  formatDate(value: string | null): string {
    if (!value) return '—';
    return new Date(value + 'T00:00:00').toLocaleDateString('pt-BR');
  }

  print(): void {
    window.print();
  }
}
