import { useEffect, useRef } from 'react';
import type { AnalyzedMove } from '../../engine/types';
import { getClassificationColor, getClassificationIcon } from '../../utils/classification';
import { useTranslation } from '../../i18n/useTranslation';
import './MoveList.css';

interface MoveListProps {
  moves: AnalyzedMove[];
  currentIndex: number;
  onSelectMove: (index: number) => void;
}

export default function MoveList({ moves, currentIndex, onSelectMove }: MoveListProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      activeRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [currentIndex]);

  const movePairs: { number: number; white?: AnalyzedMove; black?: AnalyzedMove; whiteIdx?: number; blackIdx?: number }[] = [];

  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    if (move.color === 'w') {
      movePairs.push({ number: move.moveNumber, white: move, whiteIdx: i });
    } else {
      if (movePairs.length > 0 && !movePairs[movePairs.length - 1].black) {
        movePairs[movePairs.length - 1].black = move;
        movePairs[movePairs.length - 1].blackIdx = i;
      } else {
        movePairs.push({ number: move.moveNumber, black: move, blackIdx: i });
      }
    }
  }

  const renderMove = (move: AnalyzedMove | undefined, idx: number | undefined) => {
    if (!move || idx === undefined) return <span className="move-cell empty" />;

    const cls = move.classification;
    const color = cls ? getClassificationColor(cls) : undefined;
    const icon = cls ? getClassificationIcon(cls) : '';
    const isActive = idx === currentIndex;
    const isNegative = cls === 'inaccuracy' || cls === 'mistake' || cls === 'blunder';

    return (
      <span
        ref={isActive ? activeRef : undefined}
        className={`move-cell ${isActive ? 'active' : ''} ${isNegative ? 'move-negative' : ''}`}
        style={{
          borderLeftColor: color || 'transparent',
          backgroundColor: isActive
            ? (color ? `${color}22` : 'rgba(74, 158, 255, 0.25)')
            : undefined,
        }}
        onClick={() => onSelectMove(idx)}
      >
        <span className="move-san">{move.san}</span>
        {icon && (
          <span className="move-badge" style={{ backgroundColor: color }}>
            {icon}
          </span>
        )}
      </span>
    );
  };

  return (
    <div className="move-list">
      <h3>{t('moves')}</h3>
      <div className="move-list-scroll" ref={scrollRef}>
        {movePairs.map((pair, i) => (
          <div key={i} className="move-row">
            <span className="move-number">{pair.number}.</span>
            {renderMove(pair.white, pair.whiteIdx)}
            {renderMove(pair.black, pair.blackIdx)}
          </div>
        ))}
      </div>
    </div>
  );
}
