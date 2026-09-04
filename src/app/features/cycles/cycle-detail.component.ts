import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { ElectronService } from '../../core/electron.service';
import {
  Cycle,
  CYCLE_STAGES,
  Plant,
  SEED_TYPES,
  PlantTraining,
  TRAINING_TECHNIQUES,
  JournalEntry,
  JOURNAL_ENTRY_TYPES,
  JournalPhoto,
} from '../../core/models';

type JournalPhotoWithData = JournalPhoto & { dataUrl: string };

@Component({
  selector: 'app-cycle-detail',
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
    MatTabsModule,
    MatChipsModule,
    MatDividerModule,
  ],
  templateUrl: './cycle-detail.component.html',
})
export class CycleDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private electron = inject(ElectronService);

  readonly cycle = signal<Cycle | null>(null);
  readonly plants = signal<Plant[]>([]);
  readonly trainingsByPlant = signal<Record<string, PlantTraining[]>>({});
  readonly journalEntries = signal<JournalEntry[]>([]);
  readonly photosByEntry = signal<Record<string, JournalPhotoWithData[]>>({});

  readonly stages = CYCLE_STAGES;
  readonly seedTypes = SEED_TYPES;
  readonly trainingTechniques = TRAINING_TECHNIQUES;
  readonly journalTypes = JOURNAL_ENTRY_TYPES;

  growId = '';
  cycleId = '';
  expandedPlantId: string | null = null;

  plantForm = this.fb.group({
    tag: ['', Validators.required],
    strain: [''],
    seed_type: ['feminizada'],
    pot_liters: [null as number | null],
    substrate: ['Super Solo Orgânico'],
  });

  trainingForm = this.fb.group({
    technique: ['topping', Validators.required],
    applied_at: [new Date().toISOString().slice(0, 10), Validators.required],
    notes: [''],
  });

  journalForm = this.fb.group({
    entry_date: [new Date().toISOString().slice(0, 10), Validators.required],
    entry_type: ['nota', Validators.required],
    title: [''],
    content: [''],
    plant_id: [null as string | null],
  });

  ngOnInit(): void {
    this.growId = this.route.snapshot.paramMap.get('growId')!;
    this.cycleId = this.route.snapshot.paramMap.get('cycleId')!;
    this.reload();
  }

  async reload(): Promise<void> {
    this.cycle.set(await this.electron.api.cycles.get(this.cycleId));
    this.plants.set(await this.electron.api.plants.listByCycle(this.cycleId));
    this.journalEntries.set(await this.electron.api.journal.listByCycle(this.cycleId));
  }

  stageLabel(value: string): string {
    return this.stages.find((s) => s.value === value)?.label ?? value;
  }

  seedTypeLabel(value: string | null): string {
    return this.seedTypes.find((s) => s.value === value)?.label ?? (value ?? '—');
  }

  async addPlant(): Promise<void> {
    if (this.plantForm.invalid) return;
    await this.electron.api.plants.create({ ...this.plantForm.getRawValue(), cycle_id: this.cycleId });
    this.plantForm.reset({ tag: '', strain: '', seed_type: 'feminizada', pot_liters: null, substrate: 'Super Solo Orgânico' });
    await this.reload();
  }

  async removePlant(id: string): Promise<void> {
    if (!confirm('Remover esta planta e seu histórico?')) return;
    await this.electron.api.plants.remove(id);
    await this.reload();
  }

  async togglePlant(plant: Plant): Promise<void> {
    if (this.expandedPlantId === plant.id) {
      this.expandedPlantId = null;
      return;
    }
    this.expandedPlantId = plant.id;
    const trainings = await this.electron.api.plants.listTrainings(plant.id);
    this.trainingsByPlant.update((m) => ({ ...m, [plant.id]: trainings }));
  }

  async addTraining(plantId: string): Promise<void> {
    if (this.trainingForm.invalid) return;
    await this.electron.api.plants.addTraining({ ...this.trainingForm.getRawValue(), plant_id: plantId });
    this.trainingForm.reset({ technique: 'topping', applied_at: new Date().toISOString().slice(0, 10), notes: '' });
    const trainings = await this.electron.api.plants.listTrainings(plantId);
    this.trainingsByPlant.update((m) => ({ ...m, [plantId]: trainings }));
  }

  async removeTraining(plantId: string, trainingId: string): Promise<void> {
    await this.electron.api.plants.removeTraining(trainingId);
    const trainings = await this.electron.api.plants.listTrainings(plantId);
    this.trainingsByPlant.update((m) => ({ ...m, [plantId]: trainings }));
  }

  trainingLabel(value: string): string {
    return this.trainingTechniques.find((t) => t.value === value)?.label ?? value;
  }

  async addJournalEntry(): Promise<void> {
    if (this.journalForm.invalid) return;
    await this.electron.api.journal.create({ ...this.journalForm.getRawValue(), cycle_id: this.cycleId });
    this.journalForm.reset({ entry_date: new Date().toISOString().slice(0, 10), entry_type: 'nota', title: '', content: '', plant_id: null });
    await this.reload();
  }

  async removeJournalEntry(id: string): Promise<void> {
    if (!confirm('Remover este registro do diário?')) return;
    await this.electron.api.journal.remove(id);
    await this.reload();
  }

  journalTypeLabel(value: string): string {
    return this.journalTypes.find((t) => t.value === value)?.label ?? value;
  }

  async loadPhotos(entryId: string): Promise<void> {
    const photos: JournalPhoto[] = await this.electron.api.journal.listPhotos(entryId);
    const withDataUrls: JournalPhotoWithData[] = await Promise.all(
      photos.map(async (p) => ({ ...p, dataUrl: await this.electron.api.journal.readPhotoAsDataUrl(p.stored_path) })),
    );
    this.photosByEntry.update((m) => ({ ...m, [entryId]: withDataUrls }));
  }

  async addPhoto(entryId: string): Promise<void> {
    const result = await this.electron.api.journal.addPhotoFromDialog(entryId);
    if (result) await this.loadPhotos(entryId);
  }

  async removePhoto(entryId: string, photoId: string): Promise<void> {
    await this.electron.api.journal.removePhoto(photoId);
    await this.loadPhotos(entryId);
  }
}
