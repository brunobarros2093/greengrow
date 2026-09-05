export const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS grows (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'estufa_modular' | 'sala_climatizada'
  width_m REAL,
  length_m REAL,
  height_m REAL,
  lighting_watts REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cycles (
  id TEXT PRIMARY KEY,
  grow_id TEXT NOT NULL REFERENCES grows(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'germinacao', -- germinacao|vegetativo|floracao_stretch|floracao_bulking|floracao_fade
  photoperiod TEXT, -- e.g. '18/6', '12/12'
  main_genetics TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS plants (
  id TEXT PRIMARY KEY,
  cycle_id TEXT NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  strain TEXT,
  seed_type TEXT, -- regular|feminizada|autoflorescente|clone
  pot_liters REAL,
  substrate TEXT,
  planted_at TEXT, -- data de plantio/germinação, usada para calcular dias de vida e semana
  is_final_pot INTEGER NOT NULL DEFAULT 0, -- 1 = planta ficará neste vaso, não sugerir mais transplantes
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS plant_trainings (
  id TEXT PRIMARY KEY,
  plant_id TEXT NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  technique TEXT NOT NULL, -- topping|lst|scrog|lollipopping
  applied_at TEXT NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS plant_transplants (
  id TEXT PRIMARY KEY,
  plant_id TEXT NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  pot_liters REAL NOT NULL,
  container_label TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS legal_vault_documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- hc_preventivo|laudo_medico|receituario|autorizacao_especial|outro
  file_name TEXT NOT NULL,
  stored_path TEXT NOT NULL,
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS input_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- organico|mineral|biologico
  unit TEXT NOT NULL, -- kg|L|g|mL|un
  quantity REAL NOT NULL DEFAULT 0,
  min_quantity REAL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS supersolo_recipes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'super_solo', -- super_solo|cha_humus
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS supersolo_recipe_items (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES supersolo_recipes(id) ON DELETE CASCADE,
  input_item_id TEXT REFERENCES input_items(id) ON DELETE SET NULL,
  component_name TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit TEXT NOT NULL,
  percentage REAL
);

CREATE TABLE IF NOT EXISTS mip_calendar_events (
  id TEXT PRIMARY KEY,
  grow_id TEXT REFERENCES grows(id) ON DELETE CASCADE,
  cycle_id TEXT REFERENCES cycles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  agent TEXT, -- Beauveria Bassiana | Bacillus Subtilis | Oleos Essenciais | ...
  scheduled_date TEXT NOT NULL,
  recurrence_days INTEGER DEFAULT 15,
  completed INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY,
  cycle_id TEXT NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
  plant_id TEXT REFERENCES plants(id) ON DELETE CASCADE,
  entry_date TEXT NOT NULL,
  entry_type TEXT NOT NULL DEFAULT 'nota', -- nota|trichome_check|secagem|cura
  title TEXT,
  content TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS journal_photos (
  id TEXT PRIMARY KEY,
  journal_entry_id TEXT NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  stored_path TEXT NOT NULL,
  caption TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS waterings (
  id TEXT PRIMARY KEY,
  plant_id TEXT REFERENCES plants(id) ON DELETE CASCADE,
  cycle_id TEXT REFERENCES cycles(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'agua_pura', -- agua_pura|fertirrigacao
  input_type TEXT, -- bokashi|humus_tea|algafish|water_only (rotina de fertirrigação orgânica)
  nutrients_used TEXT,
  volume_ml REAL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cycles_grow ON cycles(grow_id);
CREATE INDEX IF NOT EXISTS idx_plants_cycle ON plants(cycle_id);
CREATE INDEX IF NOT EXISTS idx_trainings_plant ON plant_trainings(plant_id);
CREATE INDEX IF NOT EXISTS idx_transplants_plant ON plant_transplants(plant_id);
CREATE INDEX IF NOT EXISTS idx_recipe_items_recipe ON supersolo_recipe_items(recipe_id);
CREATE INDEX IF NOT EXISTS idx_mip_grow ON mip_calendar_events(grow_id);
CREATE INDEX IF NOT EXISTS idx_journal_cycle ON journal_entries(cycle_id);
CREATE INDEX IF NOT EXISTS idx_journal_photos_entry ON journal_photos(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_waterings_plant ON waterings(plant_id);
CREATE INDEX IF NOT EXISTS idx_waterings_cycle ON waterings(cycle_id);
`;

// Additive migrations for databases created before a schema change.
// Each statement is executed individually and failures (e.g. "duplicate column") are ignored.
export const MIGRATIONS_SQL: string[] = [
  'ALTER TABLE waterings ADD COLUMN input_type TEXT',
  'ALTER TABLE plants ADD COLUMN planted_at TEXT',
  `UPDATE plants SET planted_at = (SELECT start_date FROM cycles WHERE cycles.id = plants.cycle_id) WHERE planted_at IS NULL`,
  'ALTER TABLE plants ADD COLUMN is_final_pot INTEGER NOT NULL DEFAULT 0',
];
