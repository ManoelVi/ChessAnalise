import { useMemo } from 'react';
import { parseFen } from '../../engine/chess';
import type { Piece as PieceType } from '../../engine/types';
import { PIECE_SVGS } from './pieces';
import './Board.css';

interface BoardProps {
  fen: string;
  flipped: boolean;
  lastMove?: { from: string; to: string } | null;
  bestMove?: string | null;
}

function uciToSquares(uci: string): { from: [number, number]; to: [number, number] } | null {
  if (!uci || uci.length < 4) return null;
  const fromCol = uci.charCodeAt(0) - 97;
  const fromRow = 8 - parseInt(uci[1]);
  const toCol = uci.charCodeAt(2) - 97;
  const toRow = 8 - parseInt(uci[3]);
  return { from: [fromRow, fromCol], to: [toRow, toCol] };
}

export default function Board({ fen, flipped, lastMove, bestMove }: BoardProps) {
  const position = useMemo(() => parseFen(fen), [fen]);

  const lastMoveSquares = useMemo(() => {
    if (!lastMove) return null;
    return uciToSquares(lastMove.from + lastMove.to);
  }, [lastMove]);

  const bestMoveSquares = useMemo(() => {
    if (!bestMove) return null;
    return uciToSquares(bestMove);
  }, [bestMove]);

  const renderPiece = (piece: PieceType | null) => {
    if (!piece) return null;
    const key = `${piece.color}${piece.type}`;
    const svg = PIECE_SVGS[key];
    if (!svg) return null;
    return (
      <div
        className="piece"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  };

  const isHighlighted = (r: number, c: number): string => {
    const classes: string[] = [];
    if (lastMoveSquares) {
      if ((r === lastMoveSquares.from[0] && c === lastMoveSquares.from[1]) ||
          (r === lastMoveSquares.to[0] && c === lastMoveSquares.to[1])) {
        classes.push('highlight-last');
      }
    }
    if (bestMoveSquares) {
      if (r === bestMoveSquares.from[0] && c === bestMoveSquares.from[1]) {
        classes.push('highlight-best-from');
      }
      if (r === bestMoveSquares.to[0] && c === bestMoveSquares.to[1]) {
        classes.push('highlight-best-to');
      }
    }
    return classes.join(' ');
  };

  const cols = flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const displayRows = flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="board-container">
      <div className="board">
        {displayRows.map((r) => (
          cols.map((c) => {
            const isLight = (r + c) % 2 === 0;
            return (
              <div
                key={`${r}-${c}`}
                className={`square ${isLight ? 'light' : 'dark'} ${isHighlighted(r, c)}`}
              >
                {c === (flipped ? 7 : 0) && (
                  <span className={`coord-rank ${isLight ? 'coord-dark' : 'coord-light'}`}>{8 - r}</span>
                )}
                {r === (flipped ? 0 : 7) && (
                  <span className={`coord-file ${isLight ? 'coord-dark' : 'coord-light'}`}>{String.fromCharCode(97 + c)}</span>
                )}
                {renderPiece(position.board[r][c])}
              </div>
            );
          })
        ))}
      </div>
    </div>
  );
}
