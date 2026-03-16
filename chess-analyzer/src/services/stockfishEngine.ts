import type { CloudEvalResponse } from '../engine/types';

let worker: Worker | null = null;
let isReady = false;
let messageHandler: ((line: string) => void) | null = null;

function initWorker(): Promise<void> {
  if (worker && isReady) return Promise.resolve();

  return new Promise((resolve, reject) => {
    try {
      worker = new Worker('/stockfish/stockfish-18-lite-single.js');

      worker.onmessage = (e: MessageEvent) => {
        const line = typeof e.data === 'string' ? e.data : String(e.data);

        if (line === 'uciok') {
          isReady = true;
          worker!.postMessage('setoption name Hash value 32');
          worker!.postMessage('isready');
        } else if (line === 'readyok') {
          resolve();
        }

        if (messageHandler) {
          messageHandler(line);
        }
      };

      worker.onerror = (e) => {
        console.error('Stockfish worker error:', e);
        reject(e);
      };

      worker.postMessage('uci');
    } catch (err) {
      reject(err);
    }
  });
}

export async function evaluatePosition(
  fen: string,
  depth: number = 16
): Promise<CloudEvalResponse | null> {
  try {
    await initWorker();
  } catch {
    return null;
  }

  if (!worker) return null;

  return new Promise((resolve) => {
    let bestCp: number | undefined;
    let bestMate: number | undefined;
    let bestMoves = '';
    let bestDepth = 0;

    messageHandler = (line: string) => {
      if (line.startsWith('info') && line.includes(' score ')) {
        const depthMatch = line.match(/\bdepth (\d+)/);
        const cpMatch = line.match(/\bscore cp (-?\d+)/);
        const mateMatch = line.match(/\bscore mate (-?\d+)/);
        const pvMatch = line.match(/\bpv (.+)/);
        const currentDepth = depthMatch ? parseInt(depthMatch[1]) : 0;

        if (currentDepth >= bestDepth) {
          bestDepth = currentDepth;
          if (cpMatch) {
            bestCp = parseInt(cpMatch[1]);
            bestMate = undefined;
          } else if (mateMatch) {
            bestMate = parseInt(mateMatch[1]);
            bestCp = undefined;
          }
          if (pvMatch) {
            bestMoves = pvMatch[1];
          }
        }
      }

      if (line.startsWith('bestmove')) {
        messageHandler = null;

        if (bestCp === undefined && bestMate === undefined) {
          resolve(null);
          return;
        }

        const result: CloudEvalResponse = {
          fen,
          knodes: 0,
          depth: bestDepth,
          pvs: [{
            moves: bestMoves,
            ...(bestCp !== undefined ? { cp: bestCp } : {}),
            ...(bestMate !== undefined ? { mate: bestMate } : {}),
          }],
        };
        resolve(result);
      }
    };

    worker!.postMessage('ucinewgame');
    worker!.postMessage(`position fen ${fen}`);
    worker!.postMessage(`go depth ${depth}`);
  });
}

export function destroyEngine(): void {
  if (worker) {
    worker.postMessage('quit');
    worker.terminate();
    worker = null;
    isReady = false;
    messageHandler = null;
  }
}
