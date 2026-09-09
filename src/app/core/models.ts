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
  planted_at: string | null;
  is_final_pot: number;
  created_at: string;
  updated_at: string;
}

export interface PlantAgeInfo {
  days: number;
  week: number;
}

/** Dias corridos desde o plantio/germinação e em qual semana de vida a planta se encontra (semana 1 = dias 0-6). */
export function computePlantAge(plantedAt: string | null | undefined): PlantAgeInfo | null {
  if (!plantedAt) return null;
  const diffMs = Date.now() - new Date(plantedAt + 'T00:00:00').getTime();
  const days = Math.max(0, Math.floor(diffMs / 86400000));
  const week = Math.floor(days / 7) + 1;
  return { days, week };
}

export interface PlantWithContext extends Plant {
  cycle_name: string;
  grow_id: string;
  grow_name: string;
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

export interface PlantTransplant {
  id: string;
  plant_id: string;
  date: string;
  pot_liters: number;
  container_label: string | null;
  notes: string | null;
  created_at: string;
}

/**
 * Progressão padrão de vasos para um ciclo perpétuo curto (colheita a cada ~2 meses,
 * ideal para autoflorescentes escalonadas entre grows). É uma aproximação — o que manda
 * de verdade é o tamanho/raiz da planta, mas serve como guia de "daqui a quantos dias".
 */
export interface TransplantStage {
  key: string;
  label: string;
  potLiters: number;
  /** Dias recomendados nesta etapa antes do próximo transplante (null = etapa final). */
  daysBeforeNext: number | null;
}

export interface PotSizes {
  cup_liters: number;
  intermediate_liters: number;
  final_liters: number;
}

export const DEFAULT_POT_SIZES: PotSizes = {
  cup_liters: 0.5,
  intermediate_liters: 5,
  final_liters: 12,
};

/** Monta as etapas de transplante a partir dos tamanhos de vaso configurados em Configurações. */
export function buildTransplantStages(potSizes: PotSizes = DEFAULT_POT_SIZES): TransplantStage[] {
  return [
    { key: 'copo_inicial', label: 'Copo Inicial (plântula)', potLiters: potSizes.cup_liters, daysBeforeNext: 7 },
    { key: 'vaso_intermediario', label: 'Vaso Intermediário', potLiters: potSizes.intermediate_liters, daysBeforeNext: 10 },
    { key: 'vaso_final', label: 'Vaso Final', potLiters: potSizes.final_liters, daysBeforeNext: null },
  ];
}

export const TRANSPLANT_STAGES: TransplantStage[] = buildTransplantStages();

/** Dias da germinação até o primeiro transplante (copo 500ml), quando ainda não há transplante registrado. */
export const GERMINATION_TO_FIRST_CUP_DAYS = 7;

export interface TransplantSuggestion {
  isFinalStage: boolean;
  nextStageLabel: string | null;
  nextPotLiters: number | null;
  dueDate: string | null;
  dueInDays: number | null;
}

function addDaysToDateStr(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetweenTodayAnd(dateStr: string): number {
  const today = new Date().toISOString().slice(0, 10);
  const diffMs = new Date(dateStr + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime();
  return Math.round(diffMs / 86400000);
}

function findStageIndexByPotLiters(stages: TransplantStage[], potLiters: number): number {
  let idx = 0;
  for (let i = 0; i < stages.length; i++) {
    if (potLiters >= stages[i].potLiters) idx = i;
  }
  return idx;
}

/** Sugere o próximo transplante (etapa, vaso e prazo aproximado) com base no histórico da planta. */
export function computeTransplantSuggestion(
  plantedAt: string | null | undefined,
  lastTransplant: Pick<PlantTransplant, 'date' | 'pot_liters'> | null | undefined,
  stages: TransplantStage[] = TRANSPLANT_STAGES,
  isFinalPot = false,
): TransplantSuggestion | null {
  if (isFinalPot) {
    return { isFinalStage: true, nextStageLabel: null, nextPotLiters: null, dueDate: null, dueInDays: null };
  }
  if (!lastTransplant) {
    if (!plantedAt) return null;
    const dueDate = addDaysToDateStr(plantedAt, GERMINATION_TO_FIRST_CUP_DAYS);
    return {
      isFinalStage: false,
      nextStageLabel: stages[0].label,
      nextPotLiters: stages[0].potLiters,
      dueDate,
      dueInDays: daysBetweenTodayAnd(dueDate),
    };
  }
  const idx = findStageIndexByPotLiters(stages, lastTransplant.pot_liters);
  const stage = stages[idx];
  if (stage.daysBeforeNext == null || idx >= stages.length - 1) {
    return { isFinalStage: true, nextStageLabel: null, nextPotLiters: null, dueDate: null, dueInDays: null };
  }
  const nextStage = stages[idx + 1];
  const dueDate = addDaysToDateStr(lastTransplant.date, stage.daysBeforeNext);
  return {
    isFinalStage: false,
    nextStageLabel: nextStage.label,
    nextPotLiters: nextStage.potLiters,
    dueDate,
    dueInDays: daysBetweenTodayAnd(dueDate),
  };
}

export function transplantSuggestionLabel(s: TransplantSuggestion | null): string {
  if (!s) return 'Informe a data de plantio para calcular o próximo transplante';
  if (s.isFinalStage) return 'Já no vaso final — sem novo transplante necessário';
  const stagePart = `${s.nextStageLabel} (${s.nextPotLiters}L)`;
  if (s.dueInDays === null) return `Próximo transplante sugerido: ${stagePart}`;
  if (s.dueInDays > 0) return `Transplantar para ${stagePart} em ~${s.dueInDays} dia(s)`;
  if (s.dueInDays === 0) return `Transplantar para ${stagePart} hoje`;
  return `Transplante para ${stagePart} atrasado ${Math.abs(s.dueInDays)} dia(s)`;
}

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
  input_type: string | null;
  nutrients_used: string | null;
  volume_ml: number | null;
  notes: string | null;
  created_at: string;
}

export const WATERING_TYPES = [
  { value: 'agua_pura', label: 'Água Pura' },
  { value: 'fertirrigacao', label: 'Fertirrigação' },
];

/** Calendário Rotativo de Fertirrigação Orgânica: rodízio semanal/quinzenal. */
export const FEEDING_INPUT_TYPES: { value: string; label: string; description: string }[] = [
  { value: 'bokashi', label: 'Bokashi Líquido', description: 'Ativação microbiana' },
  { value: 'humus_tea', label: 'Chá de Húmus', description: 'Biologia e ácidos húmicos' },
  { value: 'algafish', label: 'Algafish', description: 'Bioestimulante e aminoácidos' },
  { value: 'water_only', label: 'Água Pura', description: 'Lavagem de sais e controle de dry-back' },
];

/**
 * Rodízio semanal de fertirrigação orgânica (Bokashi Líquido, Chá de Húmus, Algafish).
 * Segundo as apostilas de referência, Bokashi e Algafish são aplicados semanalmente
 * (podendo ser misturados), enquanto o Chá de Húmus é mais esparso — aqui simplificado
 * como parte do mesmo rodízio semanal por praticidade. Água Pura não entra no rodízio:
 * é a rega comum entre uma fertirrigação e outra, registrada à parte.
 */
export const FEEDING_ROTATION_ORDER = ['bokashi', 'humus_tea', 'algafish'];

/** Intervalo mínimo recomendado entre duas fertirrigações (aplicação semanal). */
export const FEEDING_INTERVAL_DAYS = 7;

export function feedingInputLabel(value: string | null): string {
  return FEEDING_INPUT_TYPES.find((i) => i.value === value)?.label ?? (value ?? '—');
}

/** Deriva o tipo genérico de rega (água pura vs. fertirrigação) a partir do insumo escolhido no rodízio. */
export function derivedWateringType(inputType: string): string {
  return inputType === 'water_only' ? 'agua_pura' : 'fertirrigacao';
}

/** Escolhe o próximo insumo do rodízio, sempre diferente do último aplicado. */
function nextRotationInput(lastInputType: string | null): string {
  const idx = lastInputType ? FEEDING_ROTATION_ORDER.indexOf(lastInputType) : -1;
  if (idx === -1) return FEEDING_ROTATION_ORDER[0];
  return FEEDING_ROTATION_ORDER[(idx + 1) % FEEDING_ROTATION_ORDER.length];
}

/** @deprecated use computeFeedingSuggestion, que também respeita o intervalo semanal. */
export function suggestNextFeedingInput(lastInputType: string | null): string {
  return nextRotationInput(lastInputType);
}

export interface FeedingSuggestion {
  nextInputType: string;
  dueDate: string;
  dueInDays: number;
  isOverdue: boolean;
}

/**
 * Sugere o próximo insumo de fertirrigação (sempre diferente do último aplicado)
 * e a data em que ele deve ser aplicado (uma semana após a última fertirrigação real —
 * regas de água pura não contam para esse cálculo).
 */
export function computeFeedingSuggestion(
  lastFeeding: { date: string; input_type: string } | null | undefined,
): FeedingSuggestion {
  const nextInputType = nextRotationInput(lastFeeding?.input_type ?? null);
  if (!lastFeeding) {
    return { nextInputType, dueDate: new Date().toISOString().slice(0, 10), dueInDays: 0, isOverdue: false };
  }
  const dueDate = addDaysToDateStr(lastFeeding.date, FEEDING_INTERVAL_DAYS);
  const dueInDays = daysBetweenTodayAnd(dueDate);
  return { nextInputType, dueDate, dueInDays, isOverdue: dueInDays <= 0 };
}

export function feedingSuggestionLabel(s: FeedingSuggestion): string {
  const inputLabel = feedingInputLabel(s.nextInputType);
  if (s.dueInDays > 0) return `Próxima fertirrigação em ~${s.dueInDays} dia(s): ${inputLabel}`;
  if (s.dueInDays === 0) return `Fertirrigação de hoje: ${inputLabel}`;
  return `Fertirrigação atrasada ${Math.abs(s.dueInDays)} dia(s): ${inputLabel}`;
}

export type WateringStatus = 'sem_registro' | 'normal' | 'atencao' | 'critico';

export interface WateringStatusInfo {
  status: WateringStatus;
  days: number | null;
}

/** Regra de alerta: 0-2 dias normal, 3-4 janela ideal de rega, 5+ crítico (solo seco). */
export function computeWateringStatus(lastDate: string | null | undefined): WateringStatusInfo {
  if (!lastDate) return { status: 'sem_registro', days: null };
  const diffMs = Date.now() - new Date(lastDate + 'T00:00:00').getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days <= 2) return { status: 'normal', days };
  if (days <= 4) return { status: 'atencao', days };
  return { status: 'critico', days };
}

export function wateringStatusLabelFor(info: WateringStatusInfo): string {
  switch (info.status) {
    case 'sem_registro':
      return 'Sem registro de rega';
    case 'normal':
      return `${info.days} dia(s) desde a última rega`;
    case 'atencao':
      return `${info.days} dias — janela ideal de rega / verificar peso do vaso`;
    case 'critico':
      return `${info.days} dias — alerta crítico de solo seco`;
  }
}

export interface JournalPhoto {
  id: string;
  journal_entry_id: string;
  stored_path: string;
  caption: string | null;
  created_at: string;
}
