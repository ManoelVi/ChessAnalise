import './EvalBar.css';

interface EvalBarProps {
  evaluation: number | null;
  displayText: string;
}

export default function EvalBar({ evaluation, displayText }: EvalBarProps) {
  const getWhitePercent = (): number => {
    if (evaluation === null) return 50;
    // Clamp eval to ±1000cp for display
    const clamped = Math.max(-1000, Math.min(1000, evaluation));
    // Sigmoid-like mapping for smoother bar
    const percent = 50 + (50 * (2 / (1 + Math.exp(-clamped / 250)) - 1));
    return Math.max(2, Math.min(98, percent));
  };

  const whitePercent = getWhitePercent();
  const isWhiteAdvantage = evaluation !== null && evaluation >= 0;

  return (
    <div className="eval-bar-container">
      <div className="eval-bar">
        <div
          className="eval-bar-white"
          style={{ height: `${whitePercent}%` }}
        />
        <div
          className="eval-bar-black"
          style={{ height: `${100 - whitePercent}%` }}
        />
      </div>
      <div className={`eval-text ${isWhiteAdvantage ? 'eval-white' : 'eval-black'}`}>
        {displayText}
      </div>
    </div>
  );
}
