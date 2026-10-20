import type { Catalog, Evaluate, Report, State } from '../types.js';

export const STORAGE_KEY = 'udla-notas:202710:v1';
export const MAX_BACKUP_BYTES = 1_000_000;
export type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;

export function initialState(c: Catalog): State {
  return { schema_version: 1, catalog_version: c.version, periodo: c.periodo,
    updated_at: new Date().toISOString(), grades: {}, targets: {}, weights: {} };
}

export function parseBackup(raw: string, evaluate: Evaluate): State {
  if (new TextEncoder().encode(raw).length > MAX_BACKUP_BYTES) throw new Error('El respaldo supera 1 MB.');
  let state: State;
  try { state = JSON.parse(raw) as State; } catch { throw new Error('El archivo no contiene un JSON válido.'); }
  // Rust validates schema, period, identifiers, notes, targets, and all weight sums.
  evaluate(state);
  return state;
}

export function restore(storage: StoragePort, c: Catalog, evaluate: Evaluate): State {
  const raw = storage.getItem(STORAGE_KEY);
  return raw === null ? initialState(c) : parseBackup(raw, evaluate);
}

/** Validate before committing. A failed save keeps the previous in-memory state intact. */
export function commit(storage: StoragePort | null, candidate: State, evaluate: Evaluate): { state: State; report: Report } {
  const state = { ...candidate, updated_at: new Date().toISOString() };
  const report = evaluate(state);
  if (storage) storage.setItem(STORAGE_KEY, JSON.stringify(state));
  return { state, report };
}

export function exportBackup(state: State): string { return JSON.stringify(state, null, 2); }

export function normalizeDecimal(value: string): string | null {
  const trimmed = value.trim().replace(',', '.');
  return trimmed === '' ? null : trimmed;
}
