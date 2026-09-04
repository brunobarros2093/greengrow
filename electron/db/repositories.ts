import { randomUUID } from 'node:crypto';
import { getDb } from './database';

function now(): string {
  return new Date().toISOString();
}

// ---------- Grows ----------
export interface Grow {
  id: string;
  name: string;
  type: string;
  width_m: number | null;
  length_m: number | null;
  height_m: number | null;
  lighting_watts: number | null;
  created_at: string;
  updated_at: string;
}

export const GrowsRepo = {
  list(): Grow[] {
    return getDb().prepare('SELECT * FROM grows ORDER BY created_at DESC').all() as unknown as Grow[];
  },
  get(id: string): Grow | undefined {
    return getDb().prepare('SELECT * FROM grows WHERE id = ?').get(id) as unknown as Grow | undefined;
  },
  create(input: Omit<Grow, 'id' | 'created_at' | 'updated_at'>): Grow {
    const id = randomUUID();
    const ts = now();
    getDb()
      .prepare(
        `INSERT INTO grows (id, name, type, width_m, length_m, height_m, lighting_watts, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(id, input.name, input.type, input.width_m, input.length_m, input.height_m, input.lighting_watts, ts, ts);
    return this.get(id)!;
  },
  update(id: string, input: Partial<Omit<Grow, 'id' | 'created_at' | 'updated_at'>>): Grow {
    const current = this.get(id);
    if (!current) throw new Error('Grow not found');
    const merged = { ...current, ...input };
    getDb()
      .prepare(
        `UPDATE grows SET name=?, type=?, width_m=?, length_m=?, height_m=?, lighting_watts=?, updated_at=? WHERE id=?`
      )
      .run(merged.name, merged.type, merged.width_m, merged.length_m, merged.height_m, merged.lighting_watts, now(), id);
    return this.get(id)!;
  },
  remove(id: string): void {
    getDb().prepare('DELETE FROM grows WHERE id = ?').run(id);
  },
};

// ---------- Cycles ----------
export interface Cycle {
  id: string;
  grow_id: string;
  name: string;
  start_date: string;
  stage: string;
  photoperiod: string | null;
  main_genetics: string | null;
  created_at: string;
  updated_at: string;
}

export const CyclesRepo = {
  listByGrow(growId: string): Cycle[] {
    return getDb().prepare('SELECT * FROM cycles WHERE grow_id = ? ORDER BY start_date DESC').all(growId) as unknown as Cycle[];
  },
  list(): Cycle[] {
    return getDb().prepare('SELECT * FROM cycles ORDER BY start_date DESC').all() as unknown as Cycle[];
  },
  get(id: string): Cycle | undefined {
    return getDb().prepare('SELECT * FROM cycles WHERE id = ?').get(id) as unknown as Cycle | undefined;
  },
  create(input: Omit<Cycle, 'id' | 'created_at' | 'updated_at'>): Cycle {
    const id = randomUUID();
    const ts = now();
    getDb()
      .prepare(
        `INSERT INTO cycles (id, grow_id, name, start_date, stage, photoperiod, main_genetics, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(id, input.grow_id, input.name, input.start_date, input.stage, input.photoperiod, input.main_genetics, ts, ts);
    return this.get(id)!;
  },
  update(id: string, input: Partial<Omit<Cycle, 'id' | 'created_at' | 'updated_at'>>): Cycle {
    const current = this.get(id);
    if (!current) throw new Error('Cycle not found');
    const merged = { ...current, ...input };
    getDb()
      .prepare(
        `UPDATE cycles SET grow_id=?, name=?, start_date=?, stage=?, photoperiod=?, main_genetics=?, updated_at=? WHERE id=?`
      )
      .run(merged.grow_id, merged.name, merged.start_date, merged.stage, merged.photoperiod, merged.main_genetics, now(), id);
    return this.get(id)!;
  },
  remove(id: string): void {
    getDb().prepare('DELETE FROM cycles WHERE id = ?').run(id);
  },
};

// ---------- Plants ----------
export interface Plant {
  id: string;
  cycle_id: string;
  tag: string;
  strain: string | null;
  seed_type: string | null;
  pot_liters: number | null;
  substrate: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlantTraining {
  id: string;
  plant_id: string;
  technique: string;
  applied_at: string;
  notes: string | null;
}

export const PlantsRepo = {
  listByCycle(cycleId: string): Plant[] {
    return getDb().prepare('SELECT * FROM plants WHERE cycle_id = ? ORDER BY created_at DESC').all(cycleId) as unknown as Plant[];
  },
  get(id: string): Plant | undefined {
    return getDb().prepare('SELECT * FROM plants WHERE id = ?').get(id) as unknown as Plant | undefined;
  },
  create(input: Omit<Plant, 'id' | 'created_at' | 'updated_at'>): Plant {
    const id = randomUUID();
    const ts = now();
    getDb()
      .prepare(
        `INSERT INTO plants (id, cycle_id, tag, strain, seed_type, pot_liters, substrate, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(id, input.cycle_id, input.tag, input.strain, input.seed_type, input.pot_liters, input.substrate, ts, ts);
    return this.get(id)!;
  },
  update(id: string, input: Partial<Omit<Plant, 'id' | 'created_at' | 'updated_at'>>): Plant {
    const current = this.get(id);
    if (!current) throw new Error('Plant not found');
    const merged = { ...current, ...input };
    getDb()
      .prepare(
        `UPDATE plants SET cycle_id=?, tag=?, strain=?, seed_type=?, pot_liters=?, substrate=?, updated_at=? WHERE id=?`
      )
      .run(merged.cycle_id, merged.tag, merged.strain, merged.seed_type, merged.pot_liters, merged.substrate, now(), id);
    return this.get(id)!;
  },
  remove(id: string): void {
    getDb().prepare('DELETE FROM plants WHERE id = ?').run(id);
  },
  listTrainings(plantId: string): PlantTraining[] {
    return getDb().prepare('SELECT * FROM plant_trainings WHERE plant_id = ? ORDER BY applied_at DESC').all(plantId) as unknown as PlantTraining[];
  },
  addTraining(input: Omit<PlantTraining, 'id'>): PlantTraining {
    const id = randomUUID();
    getDb()
      .prepare(`INSERT INTO plant_trainings (id, plant_id, technique, applied_at, notes) VALUES (?, ?, ?, ?, ?)`)
      .run(id, input.plant_id, input.technique, input.applied_at, input.notes);
    return getDb().prepare('SELECT * FROM plant_trainings WHERE id = ?').get(id) as unknown as PlantTraining;
  },
  removeTraining(id: string): void {
    getDb().prepare('DELETE FROM plant_trainings WHERE id = ?').run(id);
  },
};

// ---------- Legal Vault ----------
export interface LegalVaultDocument {
  id: string;
  title: string;
  category: string;
  file_name: string;
  stored_path: string;
  uploaded_at: string;
  notes: string | null;
}

export const LegalVaultRepo = {
  list(): LegalVaultDocument[] {
    return getDb().prepare('SELECT * FROM legal_vault_documents ORDER BY uploaded_at DESC').all() as unknown as LegalVaultDocument[];
  },
  get(id: string): LegalVaultDocument | undefined {
    return getDb().prepare('SELECT * FROM legal_vault_documents WHERE id = ?').get(id) as unknown as LegalVaultDocument | undefined;
  },
  create(input: Omit<LegalVaultDocument, 'id' | 'uploaded_at'>): LegalVaultDocument {
    const id = randomUUID();
    const ts = now();
    getDb()
      .prepare(
        `INSERT INTO legal_vault_documents (id, title, category, file_name, stored_path, uploaded_at, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(id, input.title, input.category, input.file_name, input.stored_path, ts, input.notes);
    return this.get(id)!;
  },
  update(id: string, input: Partial<Pick<LegalVaultDocument, 'title' | 'category' | 'notes'>>): LegalVaultDocument {
    const current = this.get(id);
    if (!current) throw new Error('Document not found');
    const merged = { ...current, ...input };
    getDb()
      .prepare(`UPDATE legal_vault_documents SET title=?, category=?, notes=? WHERE id=?`)
      .run(merged.title, merged.category, merged.notes, id);
    return this.get(id)!;
  },
  remove(id: string): void {
    getDb().prepare('DELETE FROM legal_vault_documents WHERE id = ?').run(id);
  },
};

// ---------- Input Items (Insumos) ----------
export interface InputItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  min_quantity: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const InputItemsRepo = {
  list(): InputItem[] {
    return getDb().prepare('SELECT * FROM input_items ORDER BY name ASC').all() as unknown as InputItem[];
  },
  get(id: string): InputItem | undefined {
    return getDb().prepare('SELECT * FROM input_items WHERE id = ?').get(id) as unknown as InputItem | undefined;
  },
  create(input: Omit<InputItem, 'id' | 'created_at' | 'updated_at'>): InputItem {
    const id = randomUUID();
    const ts = now();
    getDb()
      .prepare(
        `INSERT INTO input_items (id, name, category, unit, quantity, min_quantity, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(id, input.name, input.category, input.unit, input.quantity, input.min_quantity, input.notes, ts, ts);
    return this.get(id)!;
  },
  update(id: string, input: Partial<Omit<InputItem, 'id' | 'created_at' | 'updated_at'>>): InputItem {
    const current = this.get(id);
    if (!current) throw new Error('Input item not found');
    const merged = { ...current, ...input };
    getDb()
      .prepare(
        `UPDATE input_items SET name=?, category=?, unit=?, quantity=?, min_quantity=?, notes=?, updated_at=? WHERE id=?`
      )
      .run(merged.name, merged.category, merged.unit, merged.quantity, merged.min_quantity, merged.notes, now(), id);
    return this.get(id)!;
  },
  adjustQuantity(id: string, delta: number): InputItem {
    const current = this.get(id);
    if (!current) throw new Error('Input item not found');
    return this.update(id, { quantity: current.quantity + delta });
  },
  remove(id: string): void {
    getDb().prepare('DELETE FROM input_items WHERE id = ?').run(id);
  },
};

// ---------- Super Solo / Chá de Húmus Recipes ----------
export interface SuperSoloRecipe {
  id: string;
  name: string;
  type: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SuperSoloRecipeItem {
  id: string;
  recipe_id: string;
  input_item_id: string | null;
  component_name: string;
  quantity: number;
  unit: string;
  percentage: number | null;
}

export const SuperSoloRepo = {
  list(): SuperSoloRecipe[] {
    return getDb().prepare('SELECT * FROM supersolo_recipes ORDER BY created_at DESC').all() as unknown as SuperSoloRecipe[];
  },
  get(id: string): SuperSoloRecipe | undefined {
    return getDb().prepare('SELECT * FROM supersolo_recipes WHERE id = ?').get(id) as unknown as SuperSoloRecipe | undefined;
  },
  create(input: Omit<SuperSoloRecipe, 'id' | 'created_at' | 'updated_at'>): SuperSoloRecipe {
    const id = randomUUID();
    const ts = now();
    getDb()
      .prepare(`INSERT INTO supersolo_recipes (id, name, type, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(id, input.name, input.type, input.notes, ts, ts);
    return this.get(id)!;
  },
  update(id: string, input: Partial<Omit<SuperSoloRecipe, 'id' | 'created_at' | 'updated_at'>>): SuperSoloRecipe {
    const current = this.get(id);
    if (!current) throw new Error('Recipe not found');
    const merged = { ...current, ...input };
    getDb()
      .prepare(`UPDATE supersolo_recipes SET name=?, type=?, notes=?, updated_at=? WHERE id=?`)
      .run(merged.name, merged.type, merged.notes, now(), id);
    return this.get(id)!;
  },
  remove(id: string): void {
    getDb().prepare('DELETE FROM supersolo_recipes WHERE id = ?').run(id);
  },
  listItems(recipeId: string): SuperSoloRecipeItem[] {
    return getDb().prepare('SELECT * FROM supersolo_recipe_items WHERE recipe_id = ?').all(recipeId) as unknown as SuperSoloRecipeItem[];
  },
  addItem(input: Omit<SuperSoloRecipeItem, 'id'>): SuperSoloRecipeItem {
    const id = randomUUID();
    getDb()
      .prepare(
        `INSERT INTO supersolo_recipe_items (id, recipe_id, input_item_id, component_name, quantity, unit, percentage)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(id, input.recipe_id, input.input_item_id, input.component_name, input.quantity, input.unit, input.percentage);
    return getDb().prepare('SELECT * FROM supersolo_recipe_items WHERE id = ?').get(id) as unknown as SuperSoloRecipeItem;
  },
  removeItem(id: string): void {
    getDb().prepare('DELETE FROM supersolo_recipe_items WHERE id = ?').run(id);
  },
};

// ---------- Waterings / Fertirrigação ----------
export interface Watering {
  id: string;
  plant_id: string | null;
  cycle_id: string | null;
  date: string;
  type: string;
  nutrients_used: string | null;
  volume_ml: number | null;
  notes: string | null;
  created_at: string;
}

export const WateringsRepo = {
  listByPlant(plantId: string): Watering[] {
    return getDb().prepare('SELECT * FROM waterings WHERE plant_id = ? ORDER BY date DESC').all(plantId) as unknown as Watering[];
  },
  listByCycle(cycleId: string): Watering[] {
    return getDb().prepare('SELECT * FROM waterings WHERE cycle_id = ? ORDER BY date DESC').all(cycleId) as unknown as Watering[];
  },
  lastByPlantIds(plantIds: string[]): Record<string, Watering | null> {
    const result: Record<string, Watering | null> = {};
    const stmt = getDb().prepare('SELECT * FROM waterings WHERE plant_id = ? ORDER BY date DESC LIMIT 1');
    for (const id of plantIds) {
      result[id] = (stmt.get(id) as unknown as Watering) ?? null;
    }
    return result;
  },
  create(input: Omit<Watering, 'id' | 'created_at'>): Watering {
    const id = randomUUID();
    const ts = now();
    getDb()
      .prepare(
        `INSERT INTO waterings (id, plant_id, cycle_id, date, type, nutrients_used, volume_ml, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(id, input.plant_id, input.cycle_id, input.date, input.type, input.nutrients_used, input.volume_ml, input.notes, ts);
    return getDb().prepare('SELECT * FROM waterings WHERE id = ?').get(id) as unknown as Watering;
  },
  createBulk(plantIds: string[], shared: Omit<Watering, 'id' | 'created_at' | 'plant_id'>): Watering[] {
    const db = getDb();
    const stmt = db.prepare(
      `INSERT INTO waterings (id, plant_id, cycle_id, date, type, nutrients_used, volume_ml, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const ts = now();
    const ids: string[] = [];
    db.exec('BEGIN');
    try {
      for (const plantId of plantIds) {
        const id = randomUUID();
        ids.push(id);
        stmt.run(id, plantId, shared.cycle_id, shared.date, shared.type, shared.nutrients_used, shared.volume_ml, shared.notes, ts);
      }
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
    const placeholders = ids.map(() => '?').join(',');
    return db.prepare(`SELECT * FROM waterings WHERE id IN (${placeholders})`).all(...ids) as unknown as Watering[];
  },
  remove(id: string): void {
    getDb().prepare('DELETE FROM waterings WHERE id = ?').run(id);
  },
};

// ---------- MIP Calendar ----------
export interface MipEvent {
  id: string;
  grow_id: string | null;
  cycle_id: string | null;
  title: string;
  agent: string | null;
  scheduled_date: string;
  recurrence_days: number | null;
  completed: number;
  notes: string | null;
  created_at: string;
}

export const MipRepo = {
  list(): MipEvent[] {
    return getDb().prepare('SELECT * FROM mip_calendar_events ORDER BY scheduled_date ASC').all() as unknown as MipEvent[];
  },
  create(input: Omit<MipEvent, 'id' | 'created_at' | 'completed'>): MipEvent {
    const id = randomUUID();
    const ts = now();
    getDb()
      .prepare(
        `INSERT INTO mip_calendar_events (id, grow_id, cycle_id, title, agent, scheduled_date, recurrence_days, completed, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
      )
      .run(id, input.grow_id, input.cycle_id, input.title, input.agent, input.scheduled_date, input.recurrence_days, input.notes, ts);
    return getDb().prepare('SELECT * FROM mip_calendar_events WHERE id = ?').get(id) as unknown as MipEvent;
  },
  toggleCompleted(id: string, completed: boolean): void {
    getDb().prepare('UPDATE mip_calendar_events SET completed = ? WHERE id = ?').run(completed ? 1 : 0, id);
  },
  remove(id: string): void {
    getDb().prepare('DELETE FROM mip_calendar_events WHERE id = ?').run(id);
  },
};

// ---------- Grow Journal ----------
export interface JournalEntry {
  id: string;
  cycle_id: string;
  plant_id: string | null;
  entry_date: string;
  entry_type: string;
  title: string | null;
  content: string | null;
  created_at: string;
}

export interface JournalPhoto {
  id: string;
  journal_entry_id: string;
  stored_path: string;
  caption: string | null;
  created_at: string;
}

export const JournalRepo = {
  listByCycle(cycleId: string): JournalEntry[] {
    return getDb().prepare('SELECT * FROM journal_entries WHERE cycle_id = ? ORDER BY entry_date DESC').all(cycleId) as unknown as JournalEntry[];
  },
  get(id: string): JournalEntry | undefined {
    return getDb().prepare('SELECT * FROM journal_entries WHERE id = ?').get(id) as unknown as JournalEntry | undefined;
  },
  create(input: Omit<JournalEntry, 'id' | 'created_at'>): JournalEntry {
    const id = randomUUID();
    const ts = now();
    getDb()
      .prepare(
        `INSERT INTO journal_entries (id, cycle_id, plant_id, entry_date, entry_type, title, content, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(id, input.cycle_id, input.plant_id, input.entry_date, input.entry_type, input.title, input.content, ts);
    return this.get(id)!;
  },
  remove(id: string): void {
    getDb().prepare('DELETE FROM journal_entries WHERE id = ?').run(id);
  },
  listPhotos(entryId: string): JournalPhoto[] {
    return getDb().prepare('SELECT * FROM journal_photos WHERE journal_entry_id = ? ORDER BY created_at DESC').all(entryId) as unknown as JournalPhoto[];
  },
  addPhoto(input: Omit<JournalPhoto, 'id' | 'created_at'>): JournalPhoto {
    const id = randomUUID();
    const ts = now();
    getDb()
      .prepare(`INSERT INTO journal_photos (id, journal_entry_id, stored_path, caption, created_at) VALUES (?, ?, ?, ?, ?)`)
      .run(id, input.journal_entry_id, input.stored_path, input.caption, ts);
    return getDb().prepare('SELECT * FROM journal_photos WHERE id = ?').get(id) as unknown as JournalPhoto;
  },
  removePhoto(id: string): void {
    getDb().prepare('DELETE FROM journal_photos WHERE id = ?').run(id);
  },
};
