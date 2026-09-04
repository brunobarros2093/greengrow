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

export const GROW_TYPES = [
  { value: 'estufa_modular', label: 'Estufa Modular' },
  { value: 'sala_climatizada', label: 'Sala Climatizada (Closed-Loop)' },
];

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

export const CYCLE_STAGES = [
  { value: 'germinacao', label: 'Germinação' },
  { value: 'vegetativo', label: 'Vegetativo' },
  { value: 'floracao_stretch', label: 'Floração - Stretch' },
  { value: 'floracao_bulking', label: 'Floração - Bulking' },
  { value: 'floracao_fade', label: 'Floração - Fade' },
];

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

export const SEED_TYPES = [
  { value: 'regular', label: 'Regular' },
  { value: 'feminizada', label: 'Feminizada' },
  { value: 'autoflorescente', label: 'Autoflorescente' },
  { value: 'clone', label: 'Clone' },
];

export interface PlantTraining {
  id: string;
  plant_id: string;
  technique: string;
  applied_at: string;
  notes: string | null;
}

export const TRAINING_TECHNIQUES = [
  { value: 'topping', label: 'Topping' },
  { value: 'lst', label: 'LST' },
  { value: 'scrog', label: 'SCROG' },
  { value: 'lollipopping', label: 'Lollipopping' },
];

export interface LegalVaultDocument {
  id: string;
  title: string;
  category: string;
  file_name: string;
  stored_path: string;
  uploaded_at: string;
  notes: string | null;
}

export const VAULT_CATEGORIES = [
  { value: 'hc_preventivo', label: 'H.C. Preventivo' },
  { value: 'laudo_medico', label: 'Laudo Médico' },
  { value: 'receituario', label: 'Receituário' },
  { value: 'autorizacao_especial', label: 'Autorização Especial' },
  { value: 'outro', label: 'Outro' },
];

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

export const INPUT_CATEGORIES = [
  { value: 'organico', label: 'Aditivo Orgânico' },
  { value: 'mineral', label: 'Aditivo Mineral' },
  { value: 'biologico', label: 'Agente Biológico' },
];

export const INPUT_UNITS = ['kg', 'g', 'L', 'mL', 'un'];

export interface SuperSoloRecipe {
  id: string;
  name: string;
  type: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const RECIPE_TYPES = [
  { value: 'super_solo', label: 'Super Solo Orgânico' },
  { value: 'cha_humus', label: 'Chá Aerado de Húmus' },
];

export interface SuperSoloRecipeItem {
  id: string;
  recipe_id: string;
  input_item_id: string | null;
  component_name: string;
  quantity: number;
  unit: string;
  percentage: number | null;
}

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

export const MIP_AGENTS = [
  'Beauveria Bassiana',
  'Bacillus Subtilis',
  'Óleo de Neem',
  'Óleos Essenciais',
  'Calda Bordalesa',
  'Outro',
];

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

export const JOURNAL_ENTRY_TYPES = [
  { value: 'nota', label: 'Nota Geral' },
  { value: 'trichome_check', label: 'Checagem de Tricomas' },
  { value: 'secagem', label: 'Secagem' },
  { value: 'cura', label: 'Cura' },
];

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

export const WATERING_TYPES = [
  { value: 'agua_pura', label: 'Água Pura' },
  { value: 'fertirrigacao', label: 'Fertirrigação' },
];

export type WateringStatus = 'sem_registro' | 'normal' | 'atencao' | 'critico';

export interface JournalPhoto {
  id: string;
  journal_entry_id: string;
  stored_path: string;
  caption: string | null;
  created_at: string;
}
