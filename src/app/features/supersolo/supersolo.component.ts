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
import { INPUT_UNITS, RECIPE_TYPES, SuperSoloRecipe, SuperSoloRecipeItem } from '../../core/models';

@Component({
  selector: 'app-supersolo',
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
  templateUrl: './supersolo.component.html',
})
export class SuperSoloComponent implements OnInit {
  private fb = inject(FormBuilder);
  private electron = inject(ElectronService);

  readonly recipes = signal<SuperSoloRecipe[]>([]);
  readonly itemsByRecipe = signal<Record<string, SuperSoloRecipeItem[]>>({});
  readonly recipeTypes = RECIPE_TYPES;
  readonly units = INPUT_UNITS;
  expandedRecipeId: string | null = null;

  recipeForm = this.fb.group({
    name: ['', Validators.required],
    type: ['super_solo', Validators.required],
    notes: [''],
  });

  itemForm = this.fb.group({
    component_name: ['', Validators.required],
    quantity: [0, Validators.required],
    unit: ['kg', Validators.required],
    percentage: [null as number | null],
  });

  ngOnInit(): void {
    this.reload();
  }

  async reload(): Promise<void> {
    this.recipes.set(await this.electron.api.supersolo.list());
  }

  async createRecipe(): Promise<void> {
    if (this.recipeForm.invalid) return;
    await this.electron.api.supersolo.create(this.recipeForm.getRawValue());
    this.recipeForm.reset({ name: '', type: 'super_solo', notes: '' });
    await this.reload();
  }

  async removeRecipe(id: string): Promise<void> {
    if (!confirm('Remover esta receita e seus componentes?')) return;
    await this.electron.api.supersolo.remove(id);
    await this.reload();
  }

  async toggleRecipe(recipe: SuperSoloRecipe): Promise<void> {
    if (this.expandedRecipeId === recipe.id) {
      this.expandedRecipeId = null;
      return;
    }
    this.expandedRecipeId = recipe.id;
    await this.loadItems(recipe.id);
  }

  async loadItems(recipeId: string): Promise<void> {
    const items = await this.electron.api.supersolo.listItems(recipeId);
    this.itemsByRecipe.update((m) => ({ ...m, [recipeId]: items }));
  }

  async addItem(recipeId: string): Promise<void> {
    if (this.itemForm.invalid) return;
    await this.electron.api.supersolo.addItem({ ...this.itemForm.getRawValue(), recipe_id: recipeId, input_item_id: null });
    this.itemForm.reset({ component_name: '', quantity: 0, unit: 'kg', percentage: null });
    await this.loadItems(recipeId);
  }

  async removeItem(recipeId: string, itemId: string): Promise<void> {
    await this.electron.api.supersolo.removeItem(itemId);
    await this.loadItems(recipeId);
  }

  typeLabel(value: string): string {
    return this.recipeTypes.find((t) => t.value === value)?.label ?? value;
  }

  totalPercentage(recipeId: string): number {
    const items = this.itemsByRecipe()[recipeId] ?? [];
    return items.reduce((sum, i) => sum + (i.percentage ?? 0), 0);
  }
}
