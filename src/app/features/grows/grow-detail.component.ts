import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
import { CYCLE_STAGES, Cycle, GROW_TYPES, Grow } from '../../core/models';

@Component({
  selector: 'app-grow-detail',
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
    MatChipsModule,
  ],
  templateUrl: './grow-detail.component.html',
})
export class GrowDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private electron = inject(ElectronService);

  readonly grow = signal<Grow | null>(null);
  readonly cycles = signal<Cycle[]>([]);
  readonly stages = CYCLE_STAGES;
  readonly growTypes = GROW_TYPES;
  growId = '';

  form = this.fb.group({
    name: ['', Validators.required],
    start_date: [new Date().toISOString().slice(0, 10), Validators.required],
    stage: ['germinacao', Validators.required],
    photoperiod: [''],
    main_genetics: [''],
  });

  ngOnInit(): void {
    this.growId = this.route.snapshot.paramMap.get('growId')!;
    this.reload();
  }

  async reload(): Promise<void> {
    this.grow.set(await this.electron.api.grows.get(this.growId));
    this.cycles.set(await this.electron.api.cycles.listByGrow(this.growId));
  }

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    await this.electron.api.cycles.create({ ...this.form.getRawValue(), grow_id: this.growId });
    this.form.reset({ name: '', start_date: new Date().toISOString().slice(0, 10), stage: 'germinacao', photoperiod: '', main_genetics: '' });
    await this.reload();
  }

  async removeCycle(id: string, event: Event): Promise<void> {
    event.stopPropagation();
    event.preventDefault();
    if (!confirm('Remover este ciclo e todas as plantas/registros vinculados?')) return;
    await this.electron.api.cycles.remove(id);
    await this.reload();
  }

  stageLabel(value: string): string {
    return this.stages.find((s) => s.value === value)?.label ?? value;
  }

  goBack(): void {
    this.router.navigate(['/grows']);
  }
}
