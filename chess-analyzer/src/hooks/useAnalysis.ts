import { useState, useCallback } from 'react';
import { pgnToFens } from '../engine/chess';
import { getCloudEval, evalToCp, evalToDisplay, getBestMove, delay } from '../services/lichessApi';
import { classifyMove, calculateAccuracy } from '../utils/classification';
import type { AnalyzedMove, ClassificationCounts, MoveClassification, PieceColor } from '../engine/types';

interface AnalysisState {
  moves: AnalyzedMove[];
  fens: string[];
  isAnalyzing: boolean;
  progress: number;
  total: number;
  whiteAccuracy: number;
  blackAccuracy: number;
  whiteStats: ClassificationCounts;
  blackStats: ClassificationCounts;
  error: string | null;
  currentEvalDisplay: string;
  currentEval: number | null;
  currentBestMove: string | null;
}

const emptyCounts = (): ClassificationCounts => ({
  brilliant: 0, great: 0, good: 0, book: 0,
  inaccuracy: 0, mistake: 0, blunder: 0,
});

export function useAnalysis() {
  const [state, setState] = useState<AnalysisState>({
    moves: [],
    fens: [],
    isAnalyzing: false,
    progress: 0,
    total: 0,
    whiteAccuracy: 0,
    blackAccuracy: 0,
    whiteStats: emptyCounts(),
    blackStats: emptyCounts(),
    error: null,
    currentEvalDisplay: '0.0',
    currentEval: 0,
    currentBestMove: null,
  });

  const analyze = useCallback(async (pgn: string, multiPv: number = 1) => {
    setState(prev => ({
      ...prev,
      isAnalyzing: true,
      progress: 0,
      error: null,
      moves: [],
      fens: [],
    }));

    try {
      const { fens, sans, ucis } = pgnToFens(pgn);

      if (sans.length === 0) {
        setState(prev => ({ ...prev, isAnalyzing: false, error: 'errorParsing' }));
        return;
      }

      setState(prev => ({ ...prev, total: sans.length, fens }));

      const evals: (number | null)[] = [];
      const evalDisplays: string[] = [];
      const bestMoves: (string | null)[] = [];

      // Get eval for initial position and each position after a move
      for (let i = 0; i <= fens.length - 1; i++) {
        const evalData = await getCloudEval(fens[i], multiPv);
        evals.push(evalToCp(evalData));
        evalDisplays.push(evalToDisplay(evalData));
        bestMoves.push(getBestMove(evalData));

        setState(prev => ({ ...prev, progress: Math.min(i, sans.length) }));
        await delay(100);
      }

      // Build analyzed moves
      const analyzedMoves: AnalyzedMove[] = [];
      const whiteCpLosses: number[] = [];
      const blackCpLosses: number[] = [];
      const whiteStats = emptyCounts();
      const blackStats = emptyCounts();

      for (let i = 0; i < sans.length; i++) {
        const color: PieceColor = i % 2 === 0 ? 'w' : 'b';
        const evalBefore = evals[i];
        const evalAfter = evals[i + 1];
        const bestMove = bestMoves[i];
        const classification = classifyMove(evalBefore, evalAfter, color, bestMove, ucis[i]);

        // Calculate centipawn loss
        if (evalBefore !== null && evalAfter !== null) {
          const sign = color === 'w' ? 1 : -1;
          const loss = Math.max(0, (evalBefore * sign) - (evalAfter * sign));
          if (color === 'w') whiteCpLosses.push(loss);
          else blackCpLosses.push(loss);
        }

        // Update stats
        const stats = color === 'w' ? whiteStats : blackStats;
        stats[classification]++;

        analyzedMoves.push({
          moveNumber: Math.floor(i / 2) + 1,
          color,
          san: sans[i],
          uci: ucis[i],
          fenBefore: fens[i],
          fenAfter: fens[i + 1],
          eval: evalAfter,
          evalBefore,
          bestMove,
          classification,
        });
      }

      const whiteAccuracy = calculateAccuracy(whiteCpLosses);
      const blackAccuracy = calculateAccuracy(blackCpLosses);

      setState(prev => ({
        ...prev,
        moves: analyzedMoves,
        fens,
        isAnalyzing: false,
        whiteAccuracy,
        blackAccuracy,
        whiteStats,
        blackStats,
        currentEvalDisplay: evalDisplays[0] || '0.0',
        currentEval: evals[0] ?? 0,
        currentBestMove: bestMoves[0],
      }));
    } catch (err) {
      console.error('Analysis error:', err);
      setState(prev => ({ ...prev, isAnalyzing: false, error: 'errorAnalysis' }));
    }
  }, []);

  const goToMove = useCallback((index: number) => {
    setState(prev => {
      if (index < -1 || index >= prev.moves.length) return prev;

      let eval_: number | null;
      let display: string;
      let bestMove: string | null;

      if (index === -1) {
        eval_ = prev.moves.length > 0 ? (prev.moves[0].evalBefore ?? 0) : 0;
        display = eval_ !== null ? (eval_ / 100).toFixed(1) : '0.0';
        bestMove = prev.moves.length > 0 ? (prev.moves[0].bestMove ?? null) : null;
      } else {
        const move = prev.moves[index];
        eval_ = move.eval ?? null;
        display = eval_ !== null ? (eval_ / 100).toFixed(1) : '?';
        if (eval_ !== null && (eval_ > 9000 || eval_ < -9000)) {
          const mate = eval_ > 0 ? 10000 - eval_ : -(10000 + eval_);
          display = `M${mate}`;
        }
        bestMove = move.bestMove ?? null;
      }

      return {
        ...prev,
        currentEval: eval_,
        currentEvalDisplay: display,
        currentBestMove: bestMove,
      };
    });
  }, []);

  return { ...state, analyze, goToMove };
}
