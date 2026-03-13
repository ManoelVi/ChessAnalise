import { useState } from 'react';
import type { ChessComGame } from '../../engine/types';
import { getRecentGames, formatTimeControl, formatDate } from '../../services/chesscomApi';
import { useTranslation } from '../../i18n/useTranslation';
import './GameInput.css';

type Tab = 'pgn' | 'username' | 'link';

interface GameInputProps {
  onSubmitPgn: (pgn: string) => void;
  isAnalyzing: boolean;
}

export default function GameInput({ onSubmitPgn, isAnalyzing }: GameInputProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('pgn');
  const [pgn, setPgn] = useState('');
  const [username, setUsername] = useState('');
  const [link, setLink] = useState('');
  const [games, setGames] = useState<ChessComGame[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = () => {
    if (!pgn.trim()) return;
    setError('');
    onSubmitPgn(pgn.trim());
  };

  const handleSearch = async () => {
    if (!username.trim()) return;
    setIsSearching(true);
    setError('');
    setGames([]);
    try {
      const results = await getRecentGames(username.trim(), 20);
      if (results.length === 0) {
        setError(t('noGames'));
      } else {
        setGames(results);
      }
    } catch {
      setError(t('playerNotFound'));
    }
    setIsSearching(false);
  };

  const handleSelectGame = (game: ChessComGame) => {
    setError('');
    onSubmitPgn(game.pgn);
  };

  const handleImportLink = async () => {
    if (!link.trim()) return;
    setError('');

    // Try to extract game ID from link and fetch via Chess.com public API
    const match = link.match(/chess\.com\/(?:game\/)?(?:live|daily)\/(\d+)/);
    if (!match) {
      setError('Link inválido. Use um link do Chess.com (ex: chess.com/game/live/12345)');
      return;
    }

    // For Chess.com links, try to find the game via username search
    setError('Para importar por link, use a aba "Usuário Chess.com" e selecione a partida da lista.');
  };

  return (
    <div className="game-input">
      <div className="tabs">
        <button className={`tab ${tab === 'pgn' ? 'active' : ''}`} onClick={() => setTab('pgn')}>
          {t('tabPgn')}
        </button>
        <button className={`tab ${tab === 'username' ? 'active' : ''}`} onClick={() => setTab('username')}>
          {t('tabUsername')}
        </button>
        <button className={`tab ${tab === 'link' ? 'active' : ''}`} onClick={() => setTab('link')}>
          {t('tabLink')}
        </button>
      </div>

      <div className="tab-content">
        {tab === 'pgn' && (
          <div className="tab-panel">
            <textarea
              value={pgn}
              onChange={(e) => setPgn(e.target.value)}
              placeholder={t('pgnPlaceholder')}
              rows={8}
              className="pgn-textarea"
            />
            <button
              className="btn-primary"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !pgn.trim()}
            >
              {isAnalyzing ? t('analyzing') : t('analyze')}
            </button>
          </div>
        )}

        {tab === 'username' && (
          <div className="tab-panel">
            <div className="search-row">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('usernamePlaceholder')}
                className="input-field"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                className="btn-primary"
                onClick={handleSearch}
                disabled={isSearching || !username.trim()}
              >
                {isSearching ? t('searching') : t('search')}
              </button>
            </div>

            {games.length > 0 && (
              <div className="games-list">
                <p className="games-label">{t('selectGame')}</p>
                {games.map((game, i) => (
                  <div
                    key={i}
                    className="game-item"
                    onClick={() => handleSelectGame(game)}
                  >
                    <div className="game-players">
                      <span className="player-white">♔ {game.white.username} ({game.white.rating})</span>
                      <span className="game-vs">{t('vs')}</span>
                      <span className="player-black">♚ {game.black.username} ({game.black.rating})</span>
                    </div>
                    <div className="game-meta">
                      <span className="game-tc">{formatTimeControl(game.time_control)}</span>
                      <span className="game-date">{formatDate(game.end_time)}</span>
                      <span className="game-result">
                        {game.white.result === 'win' ? '1-0' :
                         game.black.result === 'win' ? '0-1' : '½-½'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'link' && (
          <div className="tab-panel">
            <div className="search-row">
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder={t('linkPlaceholder')}
                className="input-field"
                onKeyDown={(e) => e.key === 'Enter' && handleImportLink()}
              />
              <button
                className="btn-primary"
                onClick={handleImportLink}
                disabled={!link.trim()}
              >
                {t('import')}
              </button>
            </div>
          </div>
        )}
      </div>

      {error && <p className="error-message">{error}</p>}
    </div>
  );
}
