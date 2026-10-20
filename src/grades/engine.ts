import type { Evaluate, Report, State } from '../types.js';

export interface EngineExports {
  memory: WebAssembly.Memory;
  allocate: (length: number) => number;
  deallocate: (pointer: number, length: number) => void;
  evaluate: (pointer: number, length: number) => bigint;
}

/** One synchronous call; no retained pointers or shared mutable output buffer. */
export function connectEngine(engine: EngineExports): Evaluate {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  return (state: State): Report => {
    const input = encoder.encode(JSON.stringify({ state }));
    const pointer = engine.allocate(input.length) >>> 0;
    let output = 0, length = 0;
    try {
      new Uint8Array(engine.memory.buffer, pointer, input.length).set(input);
      const result = engine.evaluate(pointer, input.length);
      output = Number(result & 0xffffffffn);
      length = Number(result >> 32n);
      const response = JSON.parse(decoder.decode(new Uint8Array(engine.memory.buffer, output, length))) as
        { ok: true; report: Report } | { ok: false; error: string };
      if (!response.ok) throw new Error(response.error);
      return response.report;
    } finally {
      if (length) engine.deallocate(output, length);
      engine.deallocate(pointer, input.length);
    }
  };
}

export async function loadEngine(): Promise<Evaluate> {
  const response = await fetch(new URL('../../grades.wasm', import.meta.url));
  if (!response.ok) throw new Error('No se pudo cargar el motor de cálculo. Intenta recargar con conexión.');
  const { instance } = await WebAssembly.instantiate(await response.arrayBuffer(), {});
  return connectEngine(instance.exports as unknown as EngineExports);
}
