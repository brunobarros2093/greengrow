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
  flip_date TEXT, -- data de início da floração (automático p/ autoflorescentes, manual p/ fotoperíodo)
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

-- Perfis de alimentação mineral/organomineral (ex: EasyCoco), com etapas e doses por litro,
-- para padronizar regas minerais informando apenas o volume de água.
CREATE TABLE IF NOT EXISTS feeding_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  substrate_type TEXT, -- ex: fibra_coco, organomineral
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS feeding_profile_stages (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES feeding_profiles(id) ON DELETE CASCADE,
  stage_label TEXT NOT NULL, -- ex: "Vega", "Início de Flora"
  cycle_stage_hint TEXT, -- germinacao|vegetativo|floracao_stretch|floracao_bulking|floracao_fade (opcional)
  weeks_min REAL,
  weeks_max REAL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS feeding_profile_parts (
  id TEXT PRIMARY KEY,
  stage_id TEXT NOT NULL REFERENCES feeding_profile_stages(id) ON DELETE CASCADE,
  part_label TEXT NOT NULL, -- ex: "Parte A"
  input_item_id TEXT REFERENCES input_items(id) ON DELETE SET NULL,
  dose_per_liter REAL NOT NULL, -- ex: 0.5
  dose_unit TEXT NOT NULL DEFAULT 'g' -- g|mL
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
  input_item_id TEXT REFERENCES input_items(id) ON DELETE SET NULL, -- insumo do estoque usado nesta rega, se houver
  input_item_amount_ml REAL, -- quantidade (mL) descontada do estoque do insumo acima
  feeding_method TEXT, -- organico|mineral
  feeding_profile_stage_id TEXT REFERENCES feeding_profile_stages(id) ON DELETE SET NULL, -- etapa do perfil mineral usada, se houver
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Registro (snapshot) das quantidades calculadas de cada parte para uma rega mineral específica,
-- preservando o histórico mesmo que o perfil seja alterado depois.
CREATE TABLE IF NOT EXISTS watering_parts (
  id TEXT PRIMARY KEY,
  watering_id TEXT NOT NULL REFERENCES waterings(id) ON DELETE CASCADE,
  part_label TEXT NOT NULL,
  input_item_id TEXT REFERENCES input_items(id) ON DELETE SET NULL,
  amount REAL NOT NULL,
  unit TEXT NOT NULL
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
CREATE INDEX IF NOT EXISTS idx_feeding_stages_profile ON feeding_profile_stages(profile_id);
CREATE INDEX IF NOT EXISTS idx_feeding_parts_stage ON feeding_profile_parts(stage_id);
CREATE INDEX IF NOT EXISTS idx_watering_parts_watering ON watering_parts(watering_id);
`;

// Additive migrations for databases created before a schema change.
// Each statement is executed individually and failures (e.g. "duplicate column") are ignored.
export const MIGRATIONS_SQL: string[] = [
  'ALTER TABLE waterings ADD COLUMN input_type TEXT',
  'ALTER TABLE plants ADD COLUMN planted_at TEXT',
  `UPDATE plants SET planted_at = (SELECT start_date FROM cycles WHERE cycles.id = plants.cycle_id) WHERE planted_at IS NULL`,
  'ALTER TABLE plants ADD COLUMN is_final_pot INTEGER NOT NULL DEFAULT 0',
  'ALTER TABLE waterings ADD COLUMN input_item_id TEXT REFERENCES input_items(id) ON DELETE SET NULL',
  'ALTER TABLE waterings ADD COLUMN input_item_amount_ml REAL',
  'ALTER TABLE plants ADD COLUMN flip_date TEXT',
  `CREATE TABLE IF NOT EXISTS feeding_profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    substrate_type TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS feeding_profile_stages (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES feeding_profiles(id) ON DELETE CASCADE,
    stage_label TEXT NOT NULL,
    cycle_stage_hint TEXT,
    weeks_min REAL,
    weeks_max REAL,
    sort_order INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS feeding_profile_parts (
    id TEXT PRIMARY KEY,
    stage_id TEXT NOT NULL REFERENCES feeding_profile_stages(id) ON DELETE CASCADE,
    part_label TEXT NOT NULL,
    input_item_id TEXT REFERENCES input_items(id) ON DELETE SET NULL,
    dose_per_liter REAL NOT NULL,
    dose_unit TEXT NOT NULL DEFAULT 'g'
  )`,
  `CREATE TABLE IF NOT EXISTS watering_parts (
    id TEXT PRIMARY KEY,
    watering_id TEXT NOT NULL REFERENCES waterings(id) ON DELETE CASCADE,
    part_label TEXT NOT NULL,
    input_item_id TEXT REFERENCES input_items(id) ON DELETE SET NULL,
    amount REAL NOT NULL,
    unit TEXT NOT NULL
  )`,
  'ALTER TABLE waterings ADD COLUMN feeding_method TEXT',
  'ALTER TABLE waterings ADD COLUMN feeding_profile_stage_id TEXT REFERENCES feeding_profile_stages(id) ON DELETE SET NULL',
  'CREATE INDEX IF NOT EXISTS idx_feeding_stages_profile ON feeding_profile_stages(profile_id)',
  'CREATE INDEX IF NOT EXISTS idx_feeding_parts_stage ON feeding_profile_parts(stage_id)',
  'CREATE INDEX IF NOT EXISTS idx_watering_parts_watering ON watering_parts(watering_id)',
];
