export const PROGRESSES = ['P1', 'P2', 'P3'] as const;
export type Progress = typeof PROGRESSES[number];
export interface Activity { id: string; nombre: string; peso_pct: number; pagina_silabo: number }
export interface Subject {
  codigo: string; nombre: string; creditos: string; silabo: string;
  progresos: Record<Progress, Activity[]>; observacion?: string;
}
export interface Catalog {
  version: number; periodo: string; nota_objetivo_inicial: string;
  pesos_progresos_pct: Record<Progress, number>; creditos_totales: string; materias: Subject[];
}
export interface State {
  schema_version: number; catalog_version: number; periodo: string; updated_at: string;
  grades: Record<string, string | null>; targets: Record<string, string>; weights: Record<string, string>;
}
export interface Summary {
  accumulated: string; partial: string | null; final_grade: string | null;
  maximum: string; pending_pct: string; evaluated: number; total: number;
}
export interface ProgressReport extends Summary {
  contribution: string; weights: Record<string, string>; effective_weights: Record<string, string>;
}
export interface SubjectReport extends Summary {
  progresses: Record<Progress, ProgressReport>;
  simulation: { status: 'complete' | 'achieved' | 'impossible' | 'reachable'; required: string | null; target: string };
  custom: boolean;
}
export interface Report { semester: Summary; subjects: Record<string, SubjectReport> }
export type Evaluate = (state: State) => Report;
export const gradeKey = (code: string, progress: Progress, id: string) => `${code}/${progress}/${id}`;
