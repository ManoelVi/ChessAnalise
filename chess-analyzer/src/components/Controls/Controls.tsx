import { useTranslation } from '../../i18n/useTranslation';
import './Controls.css';

interface ControlsProps {
  onFirst: () => void;
  onPrev: () => void;
  onNext: () => void;
  onLast: () => void;
  onFlip: () => void;
  canPrev: boolean;
  canNext: boolean;
}

export default function Controls({
  onFirst, onPrev, onNext, onLast, onFlip,
  canPrev, canNext,
}: ControlsProps) {
  const { t } = useTranslation();

  return (
    <div className="controls">
      <button className="ctrl-btn" onClick={onFirst} disabled={!canPrev} title={t('first')}>
        ⏮
      </button>
      <button className="ctrl-btn" onClick={onPrev} disabled={!canPrev} title={t('prev')}>
        ◀
      </button>
      <button className="ctrl-btn" onClick={onNext} disabled={!canNext} title={t('next')}>
        ▶
      </button>
      <button className="ctrl-btn" onClick={onLast} disabled={!canNext} title={t('last')}>
        ⏭
      </button>
      <button className="ctrl-btn flip-btn" onClick={onFlip} title={t('flip')}>
        🔄
      </button>
    </div>
  );
}
