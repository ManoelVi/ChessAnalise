import { useState, useCallback, useRef } from 'react';
import { generateMoveCommentary } from '../services/geminiService';
import type { AnalyzedMove } from '../engine/types';
import type { Language } from '../i18n/translations';

export function useCommentary(language: Language) {
  const [commentary, setCommentary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const cache = useRef<Map<number, string>>(new Map());
  const abortRef = useRef<number>(0);

  const fetchCommentary = useCallback(async (moveIndex: number, move: AnalyzedMove) => {
    // Check cache
    const cached = cache.current.get(moveIndex);
    if (cached) {
      setCommentary(cached);
      setIsLoading(false);
      return;
    }

    const requestId = ++abortRef.current;
    setIsLoading(true);
    setCommentary(null);

    const result = await generateMoveCommentary(move, language);

    // Only update if this is still the current request
    if (requestId !== abortRef.current) return;

    if (result) {
      cache.current.set(moveIndex, result);
      setCommentary(result);
    } else {
      setCommentary(null);
    }
    setIsLoading(false);
  }, [language]);

  const clearCommentary = useCallback(() => {
    setCommentary(null);
    setIsLoading(false);
  }, []);

  const clearCache = useCallback(() => {
    cache.current.clear();
    setCommentary(null);
    setIsLoading(false);
  }, []);

  return {
    commentary,
    isLoading,
    fetchCommentary,
    clearCommentary,
    clearCache,
  };
}
