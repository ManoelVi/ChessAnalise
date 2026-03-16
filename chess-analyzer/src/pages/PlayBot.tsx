import { useState } from 'react';
import Board from '../components/Board/Board';
import Controls from '../components/Controls/Controls';
import { useTranslation } from '../i18n/useTranslation';
import './PlayBot.css';

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export default function PlayBot() {
  const { t } = useTranslation();
  const [flipped, setFlipped] = useState(false);

  return (
    <main className="playbot-page">
      <div className="playbot-content">
        <div className="playbot-board-section">
          <Board fen={INITIAL_FEN} flipped={flipped} />
          <div className="controls">
            <button className="ctrl-btn flip-btn" onClick={() => setFlipped(f => !f)}>
              &#x21C5;
            </button>
          </div>
        </div>

        <div className="playbot-info-panel">
          <div className="playbot-card">
            <div className="playbot-icon">&#9822;</div>
            <h2 className="playbot-title">{t('playBot')}</h2>
            <p className="playbot-description">{t('comingSoon')}</p>
            <div className="playbot-features">
              <div className="playbot-feature">
                <span className="feature-dot" />
                <span>{t('playBotFeature1')}</span>
              </div>
              <div className="playbot-feature">
                <span className="feature-dot" />
                <span>{t('playBotFeature2')}</span>
              </div>
              <div className="playbot-feature">
                <span className="feature-dot" />
                <span>{t('playBotFeature3')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
