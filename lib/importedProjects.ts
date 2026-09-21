export interface ImportedProjectRecord {
  id: string;
  project_code: string;
  name: string;
  state: string;
  district: string;
  authority: string;
  project_type: string;
  description: string;
  latitude: number;
  longitude: number;
  land_required: number;
  land_acquired: number;
  affected_families: number;
  current_stage: string;
  status: string;
  compensation_status: string;
  objection_count: number;
  legal_case_count: number;
  rr_status: string;
  env_clearance_status: string;
  forest_clearance_status: string;
  crz_status: string;
  doc_completeness_pct: number;
  approval_pending: boolean;
  overdue_milestones: number;
  risk_score: number;
  risk_level: string;
  delay_probability: number;
  predicted_delay_days: number;
  confidence: number;
  primary_driver: string;
  source_name: string;
  validation_status: string;
  data_classification: string;
  imported_at: string;
  updated_at: string;
}

const globalStore = globalThis as typeof globalThis & {
  __geomatrixImportedProjects?: ImportedProjectRecord[];
};
const importedProjects = globalStore.__geomatrixImportedProjects ??= [];

export function addImportedProjects(projects: ImportedProjectRecord[]) {
  const existingCodes = new Set(importedProjects.map((project) => project.project_code));
  importedProjects.push(...projects.filter((project) => !existingCodes.has(project.project_code)));
}

export function getImportedProjects() {
  return [...importedProjects];
}
