import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { I18nContext } from './i18n/useTranslation';
import { translations, type Language, type TranslationKey } from './i18n/translations';
import { useAnalysis } from './hooks/useAnalysis';
import { playMoveSound, playCaptureSound } from './utils/sounds';
import Board from './components/Board/Board';
import EvalBar from './components/EvalBar/EvalBar';
import MoveList from './components/MoveList/MoveList';
import GameInput from './components/GameInput/GameInput';
import Stats from './components/Stats/Stats';
import Controls from './components/Controls/Controls';
import LanguageToggle from './components/LanguageToggle/LanguageToggle';
import './App.css';

export default function App() {
  const [lang, setLangState] = useState<Language>(() => {
    return (localStorage.getItem('chess-analyzer-lang') as Language) || 'pt';
  });
  const [flipped, setFlipped] = useState(false);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [showInput, setShowInput] = useState(true);
  const prevMoveIndex = useRef(-1);

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    localStorage.setItem('chess-analyzer-lang', l);
  }, []);

  const t = useCallback((key: TranslationKey) => translations[lang][key], [lang]);

  const i18nValue = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  const analysis = useAnalysis();

  const handleSubmitPgn = useCallback((pgn: string) => {
    setCurrentMoveIndex(-1);
    setShowInput(false);
    analysis.analyze(pgn);
  }, [analysis]);

  const goTo = useCallback((index: number) => {
    if (index === prevMoveIndex.current) return;
    setCurrentMoveIndex(index);
    analysis.goToMove(index);

    // Play sound when navigating to a move
    if (index >= 0 && analysis.moves[index]) {
      const move = analysis.moves[index];
      if (move.san.includes('x')) {
        playCaptureSound();
      } else {
        playMoveSound();
      }
    }
    prevMoveIndex.current = index;
  }, [analysis]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (analysis.moves.length === 0) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goTo(Math.min(currentMoveIndex + 1, analysis.moves.length - 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goTo(Math.max(currentMoveIndex - 1, -1));
      } else if (e.key === 'Home') {
        e.preventDefault();
        goTo(-1);
      } else if (e.key === 'End') {
        e.preventDefault();
        goTo(analysis.moves.length - 1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentMoveIndex, analysis.moves.length, goTo]);

  const currentFen = currentMoveIndex === -1
    ? (analysis.fens[0] || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    : analysis.moves[currentMoveIndex]?.fenAfter || analysis.fens[0] || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  const lastMove = currentMoveIndex >= 0 && analysis.moves[currentMoveIndex]
    ? {
        from: analysis.moves[currentMoveIndex].uci.slice(0, 2),
        to: analysis.moves[currentMoveIndex].uci.slice(2, 4),
      }
    : null;

  const hasAnalysis = analysis.moves.length > 0;

  return (
    <I18nContext.Provider value={i18nValue}>
      <div className="app">
        <header className="app-header">
          <div className="header-left">
            <h1 className="app-title">{t('title')}</h1>
            <p className="app-subtitle">{t('subtitle')}</p>
          </div>
          <LanguageToggle />
        </header>

        {showInput && !hasAnalysis && !analysis.isAnalyzing ? (
          <main className="app-main-input">
            <GameInput onSubmitPgn={handleSubmitPgn} isAnalyzing={analysis.isAnalyzing} />
          </main>
        ) : (
          <main className="app-main-analysis">
            {analysis.isAnalyzing && (
              <div className="progress-bar-container">
                <div className="progress-label">
                  {t('progress')} {analysis.progress} {t('of')} {analysis.total}
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${analysis.total > 0 ? (analysis.progress / analysis.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}

            <div className="analysis-layout">
              <div className="board-section">
                <div className="board-with-eval">
                  <EvalBar
                    evaluation={analysis.currentEval}
                    displayText={analysis.currentEvalDisplay}
                  />
                  <Board
                    fen={currentFen}
                    flipped={flipped}
                    lastMove={lastMove}
                    bestMove={analysis.currentBestMove}
                  />
                </div>
                <Controls
                  onFirst={() => goTo(-1)}
                  onPrev={() => goTo(Math.max(currentMoveIndex - 1, -1))}
                  onNext={() => goTo(Math.min(currentMoveIndex + 1, analysis.moves.length - 1))}
                  onLast={() => goTo(analysis.moves.length - 1)}
                  onFlip={() => setFlipped(f => !f)}
                  canPrev={currentMoveIndex > -1}
                  canNext={currentMoveIndex < analysis.moves.length - 1}
                />
                {analysis.currentBestMove && currentMoveIndex >= 0 && (
                  <div className="best-move-display">
                    {t('bestMove')}: <span className="best-move-uci">{analysis.currentBestMove}</span>
                  </div>
                )}
              </div>

              <div className="side-panel">
                <MoveList
                  moves={analysis.moves}
                  currentIndex={currentMoveIndex}
                  onSelectMove={goTo}
                />
                {!analysis.isAnalyzing && hasAnalysis && (
                  <Stats
                    whiteAccuracy={analysis.whiteAccuracy}
                    blackAccuracy={analysis.blackAccuracy}
                    whiteStats={analysis.whiteStats}
                    blackStats={analysis.blackStats}
                  />
                )}
              </div>
            </div>

            {!analysis.isAnalyzing && hasAnalysis && (
              <div className="new-analysis">
                <button
                  className="btn-secondary"
                  onClick={() => setShowInput(true)}
                >
                  Nova Analise / New Analysis
                </button>
              </div>
            )}
          </main>
        )}

        {analysis.error && (
          <div className="error-toast">{t(analysis.error as TranslationKey)}</div>
        )}
      </div>
    </I18nContext.Provider>
  );
}
