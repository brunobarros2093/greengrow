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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
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
  Watering,
  WateringStatus,
  FEEDING_INPUT_TYPES,
  feedingInputLabel,
  derivedWateringType,
  computeFeedingSuggestion,
  feedingSuggestionLabel,
  FeedingSuggestion,
  computeWateringStatus,
  wateringStatusLabelFor,
  computePlantAge,
  PlantTransplant,
  TransplantStage,
  buildTransplantStages,
  computeTransplantSuggestion,
  transplantSuggestionLabel,
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
    MatCheckboxModule,
    MatSlideToggleModule,
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
  readonly wateringsByPlant = signal<Record<string, Watering[]>>({});
  readonly lastWateringByPlant = signal<Record<string, Watering | null>>({});
  readonly transplantsByPlant = signal<Record<string, PlantTransplant[]>>({});
  readonly lastTransplantByPlant = signal<Record<string, PlantTransplant | null>>({});

  readonly stages = CYCLE_STAGES;
  readonly seedTypes = SEED_TYPES;
  readonly trainingTechniques = TRAINING_TECHNIQUES;
  readonly journalTypes = JOURNAL_ENTRY_TYPES;
  readonly feedingInputTypes = FEEDING_INPUT_TYPES;
  readonly feedingSuggestion = signal<FeedingSuggestion>(computeFeedingSuggestion(null));
  readonly transplantStages = signal<TransplantStage[]>(buildTransplantStages());

  growId = '';
  cycleId = '';
  expandedPlantId: string | null = null;

  readonly bulkWateringMode = signal(false);
  readonly selectedPlantIds = signal<Set<string>>(new Set());
  bulkBusy = false;

  plantForm = this.fb.group({
    tag: ['', Validators.required],
    strain: [''],
    seed_type: ['feminizada'],
    pot_liters: [null as number | null],
    substrate: ['Super Solo Orgânico'],
    planted_at: [new Date().toISOString().slice(0, 10), Validators.required],
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

  wateringForm = this.fb.group({
    date: [new Date().toISOString().slice(0, 10), Validators.required],
    input_type: [FEEDING_INPUT_TYPES[0].value, Validators.required],
    volume_ml: [null as number | null],
    nutrients_used: [''],
    notes: [''],
  });

  bulkWateringForm = this.fb.group({
    date: [new Date().toISOString().slice(0, 10), Validators.required],
    input_type: [FEEDING_INPUT_TYPES[0].value, Validators.required],
    volume_ml: [null as number | null],
    nutrients_used: [''],
    notes: [''],
  });

  transplantForm = this.fb.group({
    date: [new Date().toISOString().slice(0, 10), Validators.required],
    pot_liters: [null as number | null, Validators.required],
    container_label: [''],
    notes: [''],
  });

  ngOnInit(): void {
    this.growId = this.route.snapshot.paramMap.get('growId')!;
    this.cycleId = this.route.snapshot.paramMap.get('cycleId')!;
    this.loadPotSizes();
    this.reload();
  }

  async loadPotSizes(): Promise<void> {
    const sizes = await this.electron.api.settings.getPotSizes();
    this.transplantStages.set(buildTransplantStages(sizes));
  }

  async reload(): Promise<void> {
    this.cycle.set(await this.electron.api.cycles.get(this.cycleId));
    this.plants.set(await this.electron.api.plants.listByCycle(this.cycleId));
    this.journalEntries.set(await this.electron.api.journal.listByCycle(this.cycleId));
    await this.reloadLastWaterings();
    await this.reloadFeedingSuggestion();
    await this.reloadLastTransplants();
  }

  async reloadLastTransplants(): Promise<void> {
    const plantIds = this.plants().map((p) => p.id);
    if (plantIds.length === 0) {
      this.lastTransplantByPlant.set({});
      return;
    }
    this.lastTransplantByPlant.set(await this.electron.api.plants.lastTransplantByPlantIds(plantIds));
  }

  async reloadFeedingSuggestion(): Promise<void> {
    const lastFeeding = await this.electron.api.waterings.getLastCycleFeeding(this.cycleId);
    const suggestion = computeFeedingSuggestion(lastFeeding);
    this.feedingSuggestion.set(suggestion);
    this.wateringForm.patchValue({ input_type: suggestion.nextInputType });
    this.bulkWateringForm.patchValue({ input_type: suggestion.nextInputType });
  }

  readonly feedingInputLabel = feedingInputLabel;
  readonly feedingSuggestionLabel = feedingSuggestionLabel;

  async reloadLastWaterings(): Promise<void> {
    const plantIds = this.plants().map((p) => p.id);
    if (plantIds.length === 0) {
      this.lastWateringByPlant.set({});
      return;
    }
    this.lastWateringByPlant.set(await this.electron.api.waterings.lastByPlantIds(plantIds));
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
    this.plantForm.reset({
      tag: '',
      strain: '',
      seed_type: 'feminizada',
      pot_liters: null,
      substrate: 'Super Solo Orgânico',
      planted_at: new Date().toISOString().slice(0, 10),
    });
    await this.reload();
  }

  plantAge(plant: Plant) {
    return computePlantAge(plant.planted_at);
  }

  plantAgeLabel(plant: Plant): string {
    const age = this.plantAge(plant);
    if (!age) return 'Data de plantio não informada';
    return `${age.days} dia(s) de vida · Semana ${age.week}`;
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
    const waterings = await this.electron.api.waterings.listByPlant(plant.id);
    this.wateringsByPlant.update((m) => ({ ...m, [plant.id]: waterings }));
    const transplants = await this.electron.api.plants.listTransplants(plant.id);
    this.transplantsByPlant.update((m) => ({ ...m, [plant.id]: transplants }));
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

  transplantSuggestion(plant: Plant) {
    return computeTransplantSuggestion(
      plant.planted_at,
      this.lastTransplantByPlant()[plant.id],
      this.transplantStages(),
      plant.is_final_pot === 1,
    );
  }

  transplantSuggestionLabel(plant: Plant): string {
    return transplantSuggestionLabel(this.transplantSuggestion(plant));
  }

  transplantSuggestionOverdue(plant: Plant): boolean {
    const s = this.transplantSuggestion(plant);
    return !!s && !s.isFinalStage && s.dueInDays !== null && s.dueInDays <= 0;
  }

  async toggleFinalPot(plant: Plant): Promise<void> {
    const isFinal = plant.is_final_pot === 1 ? 0 : 1;
    await this.electron.api.plants.update(plant.id, { is_final_pot: isFinal });
    await this.reload();
  }

  onTransplantStagePick(stage: TransplantStage): void {
    this.transplantForm.patchValue({ pot_liters: stage.potLiters, container_label: stage.label });
  }

  async addTransplant(plantId: string): Promise<void> {
    if (this.transplantForm.invalid) return;
    await this.electron.api.plants.addTransplant({ ...this.transplantForm.getRawValue(), plant_id: plantId });
    this.transplantForm.reset({ date: new Date().toISOString().slice(0, 10), pot_liters: null, container_label: '', notes: '' });
    const transplants = await this.electron.api.plants.listTransplants(plantId);
    this.transplantsByPlant.update((m) => ({ ...m, [plantId]: transplants }));
    await this.reload();
  }

  async removeTransplant(plantId: string, transplantId: string): Promise<void> {
    await this.electron.api.plants.removeTransplant(transplantId);
    const transplants = await this.electron.api.plants.listTransplants(plantId);
    this.transplantsByPlant.update((m) => ({ ...m, [plantId]: transplants }));
    await this.reloadLastTransplants();
  }

  async addWatering(plantId: string): Promise<void> {
    if (this.wateringForm.invalid) return;
    const { input_type, ...rest } = this.wateringForm.getRawValue();
    await this.electron.api.waterings.create({
      ...rest,
      input_type,
      type: derivedWateringType(input_type!),
      plant_id: plantId,
      cycle_id: this.cycleId,
    });
    this.wateringForm.reset({ date: new Date().toISOString().slice(0, 10), input_type: this.feedingSuggestion().nextInputType, volume_ml: null, nutrients_used: '', notes: '' });
    const waterings = await this.electron.api.waterings.listByPlant(plantId);
    this.wateringsByPlant.update((m) => ({ ...m, [plantId]: waterings }));
    await this.reloadLastWaterings();
    await this.reloadFeedingSuggestion();
  }

  async removeWatering(plantId: string, wateringId: string): Promise<void> {
    await this.electron.api.waterings.remove(wateringId);
    const waterings = await this.electron.api.waterings.listByPlant(plantId);
    this.wateringsByPlant.update((m) => ({ ...m, [plantId]: waterings }));
    await this.reloadLastWaterings();
    await this.reloadFeedingSuggestion();
  }

  daysSinceLastWatering(plantId: string): number | null {
    return computeWateringStatus(this.lastWateringByPlant()[plantId]?.date).days;
  }

  wateringStatus(plantId: string): WateringStatus {
    return computeWateringStatus(this.lastWateringByPlant()[plantId]?.date).status;
  }

  wateringStatusLabel(plantId: string): string {
    return wateringStatusLabelFor(computeWateringStatus(this.lastWateringByPlant()[plantId]?.date));
  }

  toggleBulkWateringMode(): void {
    this.bulkWateringMode.update((v) => !v);
    this.selectedPlantIds.set(new Set());
  }

  isPlantSelected(plantId: string): boolean {
    return this.selectedPlantIds().has(plantId);
  }

  togglePlantSelection(plantId: string): void {
    this.selectedPlantIds.update((set) => {
      const next = new Set(set);
      if (next.has(plantId)) next.delete(plantId);
      else next.add(plantId);
      return next;
    });
  }

  toggleSelectAllPlants(): void {
    const allSelected = this.selectedPlantIds().size === this.plants().length && this.plants().length > 0;
    this.selectedPlantIds.set(allSelected ? new Set() : new Set(this.plants().map((p) => p.id)));
  }

  async addBulkWatering(): Promise<void> {
    if (this.bulkWateringForm.invalid || this.selectedPlantIds().size === 0) return;
    this.bulkBusy = true;
    try {
      const plantIds = Array.from(this.selectedPlantIds());
      const { input_type, ...rest } = this.bulkWateringForm.getRawValue();
      await this.electron.api.waterings.createBulk(plantIds, {
        ...rest,
        input_type,
        type: derivedWateringType(input_type!),
        cycle_id: this.cycleId,
      });
      this.bulkWateringForm.reset({ date: new Date().toISOString().slice(0, 10), input_type: this.feedingSuggestion().nextInputType, volume_ml: null, nutrients_used: '', notes: '' });
      this.selectedPlantIds.set(new Set());
      this.bulkWateringMode.set(false);
      await this.reloadLastWaterings();
      await this.reloadFeedingSuggestion();
      if (this.expandedPlantId) {
        const waterings = await this.electron.api.waterings.listByPlant(this.expandedPlantId);
        this.wateringsByPlant.update((m) => ({ ...m, [this.expandedPlantId as string]: waterings }));
      }
    } finally {
      this.bulkBusy = false;
    }
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
