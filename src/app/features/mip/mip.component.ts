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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { ElectronService } from '../../core/electron.service';
import { MIP_AGENTS, MipEvent } from '../../core/models';
import { DIAGNOSIS_GUIDE } from './diagnosis-guide.data';

@Component({
  selector: 'app-mip',
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
    MatCheckboxModule,
    MatTabsModule,
  ],
  templateUrl: './mip.component.html',
})
export class MipComponent implements OnInit {
  private fb = inject(FormBuilder);
  private electron = inject(ElectronService);

  readonly events = signal<MipEvent[]>([]);
  readonly agents = MIP_AGENTS;
  readonly diagnosisGuide = DIAGNOSIS_GUIDE;

  form = this.fb.group({
    title: ['', Validators.required],
    agent: ['Beauveria Bassiana'],
    scheduled_date: [new Date().toISOString().slice(0, 10), Validators.required],
    recurrence_days: [15],
    notes: [''],
  });

  ngOnInit(): void {
    this.reload();
  }

  async reload(): Promise<void> {
    this.events.set(await this.electron.api.mip.list());
  }

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    await this.electron.api.mip.create({ ...this.form.getRawValue(), grow_id: null, cycle_id: null });
    this.form.reset({ title: '', agent: 'Beauveria Bassiana', scheduled_date: new Date().toISOString().slice(0, 10), recurrence_days: 15, notes: '' });
    await this.reload();
  }

  async toggle(event: MipEvent): Promise<void> {
    await this.electron.api.mip.toggleCompleted(event.id, !event.completed);
    await this.reload();
  }

  async remove(id: string): Promise<void> {
    await this.electron.api.mip.remove(id);
    await this.reload();
  }
}
