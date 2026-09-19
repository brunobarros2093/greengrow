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
import { ElectronService } from '../../core/electron.service';
import {
  FeedingProfile,
  FeedingProfileStageWithParts,
  InputItem,
  DOSE_UNITS,
  CYCLE_STAGES,
  formatStageWeeks,
} from '../../core/models';

@Component({
  selector: 'app-feeding-profiles',
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
  ],
  templateUrl: './feeding-profiles.component.html',
})
export class FeedingProfilesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private electron = inject(ElectronService);

  readonly profiles = signal<FeedingProfile[]>([]);
  readonly selectedProfileId = signal<string | null>(null);
  readonly stages = signal<FeedingProfileStageWithParts[]>([]);
  readonly stockItems = signal<InputItem[]>([]);
  readonly doseUnits = DOSE_UNITS;
  readonly cycleStages = CYCLE_STAGES;
  readonly formatStageWeeks = formatStageWeeks;
  expandedStageId: string | null = null;
  busy = false;

  profileForm = this.fb.group({
    name: ['', Validators.required],
    substrate_type: [''],
    notes: [''],
  });

  stageForm = this.fb.group({
    stage_label: ['', Validators.required],
    cycle_stage_hint: [null as string | null],
    weeks_min: [null as number | null, Validators.required],
    weeks_max: [null as number | null],
  });

  partForm = this.fb.group({
    part_label: ['', Validators.required],
    dose_per_liter: [null as number | null, Validators.required],
    dose_unit: ['g', Validators.required],
    input_item_id: [null as string | null],
  });

  ngOnInit(): void {
    this.loadProfiles();
    this.loadStockItems();
  }

  async loadStockItems(): Promise<void> {
    this.stockItems.set(await this.electron.api.inputs.list());
  }

  async loadProfiles(): Promise<void> {
    this.profiles.set(await this.electron.api.feedingProfiles.list());
  }

  async selectProfile(id: string): Promise<void> {
    this.selectedProfileId.set(id);
    await this.loadStages();
  }

  async loadStages(): Promise<void> {
    const id = this.selectedProfileId();
    if (!id) {
      this.stages.set([]);
      return;
    }
    this.stages.set(await this.electron.api.feedingProfiles.listStagesWithParts(id));
  }

  async createProfile(): Promise<void> {
    if (this.profileForm.invalid) return;
    const profile = await this.electron.api.feedingProfiles.create(this.profileForm.getRawValue());
    this.profileForm.reset({ name: '', substrate_type: '', notes: '' });
    await this.loadProfiles();
    await this.selectProfile(profile.id);
  }

  async removeProfile(id: string): Promise<void> {
    if (!confirm('Remover este perfil de alimentação e todas as suas etapas?')) return;
    await this.electron.api.feedingProfiles.remove(id);
    if (this.selectedProfileId() === id) {
      this.selectedProfileId.set(null);
      this.stages.set([]);
    }
    await this.loadProfiles();
  }

  async seedEasyCoco(): Promise<void> {
    this.busy = true;
    try {
      const profile = await this.electron.api.feedingProfiles.seedEasyCocoDefault();
      await this.loadProfiles();
      await this.selectProfile(profile.id);
    } finally {
      this.busy = false;
    }
  }

  async addStage(): Promise<void> {
    const profileId = this.selectedProfileId();
    if (!profileId || this.stageForm.invalid) return;
    const value = this.stageForm.getRawValue();
    await this.electron.api.feedingProfiles.addStage({
      ...value,
      weeks_max: value.weeks_max ?? value.weeks_min,
      profile_id: profileId,
      sort_order: this.stages().length,
    });
    this.stageForm.reset({ stage_label: '', cycle_stage_hint: null, weeks_min: null, weeks_max: null });
    await this.loadStages();
  }

  async removeStage(id: string): Promise<void> {
    if (!confirm('Remover esta etapa e suas partes/doses?')) return;
    await this.electron.api.feedingProfiles.removeStage(id);
    await this.loadStages();
  }

  toggleStage(stageId: string): void {
    this.expandedStageId = this.expandedStageId === stageId ? null : stageId;
  }

  async addPart(stageId: string): Promise<void> {
    if (this.partForm.invalid) return;
    await this.electron.api.feedingProfiles.addPart({ ...this.partForm.getRawValue(), stage_id: stageId });
    this.partForm.reset({ part_label: '', dose_per_liter: null, dose_unit: 'g', input_item_id: null });
    await this.loadStages();
  }

  async removePart(id: string): Promise<void> {
    await this.electron.api.feedingProfiles.removePart(id);
    await this.loadStages();
  }

  stockItemName(id: string | null): string {
    if (!id) return '—';
    return this.stockItems().find((i) => i.id === id)?.name ?? 'Insumo removido';
  }

  cycleStageLabel(value: string | null): string {
    return this.cycleStages.find((s) => s.value === value)?.label ?? '—';
  }
}
