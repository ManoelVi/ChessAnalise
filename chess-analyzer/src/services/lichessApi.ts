import type { CloudEvalResponse } from '../engine/types';

const BASE_URL = 'https://lichess.org/api';

export async function getCloudEval(
  fen: string,
  multiPv: number = 1
): Promise<CloudEvalResponse | null> {
  try {
    const url = `${BASE_URL}/cloud-eval?fen=${encodeURIComponent(fen)}&multiPv=${multiPv}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function evalToCp(evalData: CloudEvalResponse | null): number | null {
  if (!evalData || !evalData.pvs || evalData.pvs.length === 0) return null;
  const pv = evalData.pvs[0];
  if (pv.mate !== undefined) {
    return pv.mate > 0 ? 10000 - pv.mate : -10000 - pv.mate;
  }
  return pv.cp ?? null;
}

export function evalToDisplay(evalData: CloudEvalResponse | null): string {
  if (!evalData || !evalData.pvs || evalData.pvs.length === 0) return '?';
  const pv = evalData.pvs[0];
  if (pv.mate !== undefined) return `M${pv.mate}`;
  if (pv.cp !== undefined) return (pv.cp / 100).toFixed(1);
  return '?';
}

export function getBestMove(evalData: CloudEvalResponse | null): string | null {
  if (!evalData || !evalData.pvs || evalData.pvs.length === 0) return null;
  const moves = evalData.pvs[0].moves;
  if (!moves) return null;
  return moves.split(' ')[0];
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
