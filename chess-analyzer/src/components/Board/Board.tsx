import { useMemo } from 'react';
import { parseFen } from '../../engine/chess';
import type { Piece as PieceType, MoveClassification } from '../../engine/types';
import { getClassificationColor, getClassificationIcon } from '../../utils/classification';
import { PIECE_SVGS } from './pieces';
import './Board.css';

interface BoardProps {
  fen: string;
  flipped: boolean;
  lastMove?: { from: string; to: string } | null;
  bestMove?: string | null;
  moveClassification?: MoveClassification | null;
}

function uciToSquares(uci: string): { from: [number, number]; to: [number, number] } | null {
  if (!uci || uci.length < 4) return null;
  const fromCol = uci.charCodeAt(0) - 97;
  const fromRow = 8 - parseInt(uci[1]);
  const toCol = uci.charCodeAt(2) - 97;
  const toRow = 8 - parseInt(uci[3]);
  return { from: [fromRow, fromCol], to: [toRow, toCol] };
}

export default function Board({ fen, flipped, lastMove, bestMove, moveClassification }: BoardProps) {
  const position = useMemo(() => parseFen(fen), [fen]);

  const lastMoveSquares = useMemo(() => {
    if (!lastMove) return null;
    return uciToSquares(lastMove.from + lastMove.to);
  }, [lastMove]);

  const bestMoveSquares = useMemo(() => {
    if (!bestMove) return null;
    return uciToSquares(bestMove);
  }, [bestMove]);

  // Show arrow only when played move differs from best move
  const showArrow = useMemo(() => {
    if (!bestMove || !lastMove) return false;
    const playedUci = lastMove.from + lastMove.to;
    return playedUci !== bestMove;
  }, [bestMove, lastMove]);

  // Classification badge info
  const badgeInfo = useMemo(() => {
    if (!moveClassification || !lastMoveSquares) return null;
    const icon = getClassificationIcon(moveClassification);
    if (!icon) return null; // 'good' and 'book' have no icon
    const color = getClassificationColor(moveClassification);
    return { icon, color, row: lastMoveSquares.to[0], col: lastMoveSquares.to[1] };
  }, [moveClassification, lastMoveSquares]);

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
    return classes.join(' ');
  };

  // Convert board row/col to SVG pixel coordinates (center of square)
  const squareToPixel = (row: number, col: number): [number, number] => {
    const displayCol = flipped ? 7 - col : col;
    const displayRow = flipped ? 7 - row : row;
    return [displayCol * 60 + 30, displayRow * 60 + 30];
  };

  const cols = flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const displayRows = flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="board-container">
      <div className="board">
        {displayRows.map((r) => (
          cols.map((c) => {
            const isLight = (r + c) % 2 === 0;
            const hasBadge = badgeInfo && badgeInfo.row === r && badgeInfo.col === c;
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
                {hasBadge && (
                  <span
                    className="classification-badge"
                    style={{ backgroundColor: badgeInfo.color }}
                  >
                    {badgeInfo.icon}
                  </span>
                )}
              </div>
            );
          })
        ))}
        {showArrow && bestMoveSquares && (() => {
          const [x1, y1] = squareToPixel(bestMoveSquares.from[0], bestMoveSquares.from[1]);
          const [x2, y2] = squareToPixel(bestMoveSquares.to[0], bestMoveSquares.to[1]);
          // Shorten arrow so head doesn't overlap center
          const dx = x2 - x1;
          const dy = y2 - y1;
          const len = Math.sqrt(dx * dx + dy * dy);
          const shortenBy = 12;
          const ex = x2 - (dx / len) * shortenBy;
          const ey = y2 - (dy / len) * shortenBy;
          return (
            <svg className="best-move-arrow" viewBox="0 0 480 480">
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="10"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="rgba(34, 197, 94, 0.85)" />
                </marker>
              </defs>
              <line
                x1={x1} y1={y1} x2={ex} y2={ey}
                stroke="rgba(34, 197, 94, 0.85)"
                strokeWidth="8"
                strokeLinecap="round"
                markerEnd="url(#arrowhead)"
              />
            </svg>
          );
        })()}
      </div>
    </div>
  );
}
