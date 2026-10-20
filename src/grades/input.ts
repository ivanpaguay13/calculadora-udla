import { normalizeDecimal } from '../storage/state.js';

export type DecimalInput =
  | { kind: 'empty' | 'draft' }
  | { kind: 'invalid'; message: string }
  | { kind: 'valid'; value: string; cents: number };

/** UI parsing only. Rust remains the authority for persisted grades and calculations. */
export function parseDecimalInput(raw: string, options: { minCents?: number; maxCents?: number; finish?: boolean } = {}): DecimalInput {
  const { minCents = 0, maxCents = 1000, finish = false } = options;
  let value = normalizeDecimal(raw);
  if (value === null) return { kind: 'empty' };
  const invalid = (): DecimalInput => ({ kind: 'invalid', message: `Usa un número entre ${minCents / 100} y ${maxCents / 100}, con hasta dos decimales. Acepta coma o punto.` });
  // A trailing separator is a normal intermediate keystroke, not a missing grade.
  if (/^[0-9]{0,3}\.$/.test(value)) {
    if (value !== '.' && Number(value.slice(0, -1)) * 100 > maxCents) return invalid();
    if (!finish) return { kind: 'draft' };
    if (value === '.') return invalid();
    value = value.slice(0, -1);
  }
  if (value.startsWith('.')) value = `0${value}`;
  const match = /^([0-9]{1,3})(?:\.([0-9]{1,2}))?$/.exec(value);
  if (!match) return invalid();
  const whole = String(Number(match[1]!));
  const fraction = match[2];
  const cents = Number(whole) * 100 + Number((fraction ?? '').padEnd(2, '0'));
  if (cents < minCents || cents > maxCents) return invalid();
  return { kind: 'valid', value: fraction === undefined ? whole : `${whole}.${fraction}`, cents };
}
