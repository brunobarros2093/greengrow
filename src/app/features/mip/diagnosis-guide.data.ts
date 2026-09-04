export interface DiagnosisGuideEntry {
  title: string;
  category: 'carencia' | 'excesso' | 'ph';
  symptoms: string;
  action: string;
}

export const DIAGNOSIS_GUIDE: DiagnosisGuideEntry[] = [
  {
    title: 'Carência de Nitrogênio (N)',
    category: 'carencia',
    symptoms: 'Amarelamento uniforme das folhas mais velhas (inferiores), começando pelas pontas.',
    action: 'Reforçar com fontes orgânicas de N (farinha de sangue, guano rico em N, chá de húmus).',
  },
  {
    title: 'Carência de Fósforo (P)',
    category: 'carencia',
    symptoms: 'Folhas verde-escuras/azuladas, manchas roxas nos pecíolos e caules, crescimento lento.',
    action: 'Adicionar farinha de ossos ou guano rico em P; verificar pH da rega (ideal 6.0-7.0 em solo).',
  },
  {
    title: 'Carência de Potássio (K)',
    category: 'carencia',
    symptoms: 'Bordas e pontas das folhas queimadas (amareladas/marrons), folhas mais velhas afetadas primeiro.',
    action: 'Aplicar silicato de potássio ou cinzas de madeira em pequenas quantidades.',
  },
  {
    title: 'Carência de Cálcio/Magnésio (Cal-Mag)',
    category: 'carencia',
    symptoms: 'Manchas intervenais (entre as nervuras) em folhas novas, folhas quebradiças e enroladas.',
    action: 'Suplementar com calcário dolomítico ou Cal-Mag; comum em substratos ácidos ou água RO.',
  },
  {
    title: 'Excesso de Nitrogênio',
    category: 'excesso',
    symptoms: 'Folhas verde muito escuro, pontas em garra ("clawing") curvadas para baixo, crescimento excessivamente vegetativo.',
    action: 'Reduzir adubação nitrogenada e aumentar rega para lixiviar o excesso.',
  },
  {
    title: 'Toxicidade de Nutrientes (Queima geral)',
    category: 'excesso',
    symptoms: 'Pontas das folhas queimadas em toda a planta, folhas rígidas e quebradiças.',
    action: 'Lixiviar o substrato com água pura e pausar a adubação por um ciclo de rega.',
  },
  {
    title: 'pH Baixo (Ácido, < 6.0 em solo)',
    category: 'ph',
    symptoms: 'Bloqueio de Cálcio, Magnésio e Fósforo mesmo com adubação correta; manchas intervenais.',
    action: 'Corrigir substrato com calcário dolomítico; verificar água de irrigação.',
  },
  {
    title: 'pH Alto (Alcalino, > 7.5 em solo)',
    category: 'ph',
    symptoms: 'Bloqueio de Ferro, Manganês e Zinco; clorose intervenal em folhas novas do topo.',
    action: 'Usar substrato com matéria orgânica ácida (turfa, húmus) e monitorar a água de irrigação.',
  },
];
