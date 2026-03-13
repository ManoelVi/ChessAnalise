import type { MoveClassification, PieceColor } from '../engine/types';

export function classifyMove(
  evalBefore: number | null,
  evalAfter: number | null,
  color: PieceColor,
  bestMove: string | null,
  playedUci: string
): MoveClassification {
  if (evalBefore === null || evalAfter === null) return 'book';

  // Normalize eval to the perspective of the player who moved
  const sign = color === 'w' ? 1 : -1;
  const before = evalBefore * sign;
  const after = evalAfter * sign;
  const delta = after - before;

  // If played the best move
  if (bestMove && playedUci === bestMove) {
    if (delta > 50) return 'brilliant';
    return 'great';
  }

  // Classification based on centipawn loss
  const cpLoss = -delta;

  if (cpLoss <= 10) return 'good';
  if (cpLoss <= 25) return 'good';
  if (cpLoss <= 50) return 'inaccuracy';
  if (cpLoss <= 100) return 'mistake';
  if (cpLoss <= 200) return 'mistake';
  return 'blunder';
}

export function getClassificationColor(classification: MoveClassification): string {
  const colors: Record<MoveClassification, string> = {
    brilliant: '#26c2a3',
    great: '#5b8bb6',
    good: '#97af8b',
    book: '#a88764',
    inaccuracy: '#e6c348',
    mistake: '#e68a3a',
    blunder: '#ca3431',
  };
  return colors[classification];
}

export function getClassificationIcon(classification: MoveClassification): string {
  const icons: Record<MoveClassification, string> = {
    brilliant: '!!',
    great: '!',
    good: '',
    book: '',
    inaccuracy: '?!',
    mistake: '?',
    blunder: '??',
  };
  return icons[classification];
}

export function calculateAccuracy(cpLosses: number[]): number {
  if (cpLosses.length === 0) return 100;
  const avgLoss = cpLosses.reduce((a, b) => a + b, 0) / cpLosses.length;
  // Formula inspired by Chess.com's accuracy calculation
  const accuracy = 103.1668 * Math.exp(-0.04354 * avgLoss) - 3.1668;
  return Math.max(0, Math.min(100, accuracy));
}
