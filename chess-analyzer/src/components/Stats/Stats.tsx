import type { ClassificationCounts, MoveClassification } from '../../engine/types';
import { getClassificationColor } from '../../utils/classification';
import { useTranslation } from '../../i18n/useTranslation';
import './Stats.css';

interface StatsProps {
  whiteAccuracy: number;
  blackAccuracy: number;
  whiteStats: ClassificationCounts;
  blackStats: ClassificationCounts;
  whiteName?: string;
  blackName?: string;
}

const CLASSIFICATIONS: MoveClassification[] = [
  'brilliant', 'great', 'good', 'book', 'inaccuracy', 'mistake', 'blunder',
];

export default function Stats({
  whiteAccuracy, blackAccuracy,
  whiteStats, blackStats,
  whiteName, blackName,
}: StatsProps) {
  const { t } = useTranslation();

  return (
    <div className="stats-panel">
      <h3>{t('stats')}</h3>

      <div className="accuracy-section">
        <div className="accuracy-row">
          <span className="accuracy-label">♔ {whiteName || t('white')}</span>
          <div className="accuracy-bar-container">
            <div className="accuracy-bar" style={{ width: `${whiteAccuracy}%` }} />
          </div>
          <span className="accuracy-value">{whiteAccuracy.toFixed(1)}%</span>
        </div>
        <div className="accuracy-row">
          <span className="accuracy-label">♚ {blackName || t('black')}</span>
          <div className="accuracy-bar-container">
            <div className="accuracy-bar black-bar" style={{ width: `${blackAccuracy}%` }} />
          </div>
          <span className="accuracy-value">{blackAccuracy.toFixed(1)}%</span>
        </div>
      </div>

      <div className="classification-grid">
        <div className="class-header" />
        <div className="class-header">♔</div>
        <div className="class-header">♚</div>
        {CLASSIFICATIONS.map((cls) => (
          <div key={cls} className="class-row-fragment">
            <div className="class-label" style={{ color: getClassificationColor(cls) }}>
              {t(cls)}
            </div>
            <div className="class-count">{whiteStats[cls]}</div>
            <div className="class-count">{blackStats[cls]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
