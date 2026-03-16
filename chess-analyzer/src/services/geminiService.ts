import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AnalyzedMove, MoveClassification } from '../engine/types';
import type { Language } from '../i18n/translations';

const MODEL_NAME = 'gemini-2.0-flash';

let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('VITE_GEMINI_API_KEY not configured');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

function classificationToLabel(c: MoveClassification, lang: Language): string {
  const labels: Record<MoveClassification, Record<Language, string>> = {
    brilliant: { pt: 'Brilhante', en: 'Brilliant' },
    great: { pt: 'Ótimo', en: 'Great' },
    good: { pt: 'Bom', en: 'Good' },
    book: { pt: 'Livro', en: 'Book' },
    inaccuracy: { pt: 'Imprecisão', en: 'Inaccuracy' },
    mistake: { pt: 'Erro', en: 'Mistake' },
    blunder: { pt: 'Blunder', en: 'Blunder' },
  };
  return labels[c]?.[lang] ?? c;
}

function formatEval(cp: number | null | undefined): string {
  if (cp === null || cp === undefined) return '?';
  if (cp > 9000) return `M${10000 - cp}`;
  if (cp < -9000) return `-M${10000 + cp}`;
  return (cp / 100).toFixed(1);
}

export async function generateMoveCommentary(
  move: AnalyzedMove,
  language: Language
): Promise<string | null> {
  const client = getClient();
  const model = client.getGenerativeModel({ model: MODEL_NAME });

  const langName = language === 'pt' ? 'português' : 'English';
  const colorName = language === 'pt'
    ? (move.color === 'w' ? 'Brancas' : 'Pretas')
    : (move.color === 'w' ? 'White' : 'Black');

  const classLabel = move.classification
    ? classificationToLabel(move.classification, language)
    : '?';

  const prompt = language === 'pt'
    ? `Você é um coach de xadrez analisando uma partida. Comente o lance de forma breve (2-3 frases curtas). Seja direto e educativo.

Lance ${move.moveNumber}. ${move.san} (${colorName})
Classificação: ${classLabel}
Avaliação: ${formatEval(move.evalBefore)} → ${formatEval(move.eval)}
${move.bestMove && move.bestMove !== move.uci ? `Melhor lance era: ${move.bestMove}` : 'Este foi o melhor lance.'}

Responda apenas com o comentário em ${langName}. Sem formatação markdown.`
    : `You are a chess coach analyzing a game. Comment on the move briefly (2-3 short sentences). Be direct and educational.

Move ${move.moveNumber}. ${move.san} (${colorName})
Classification: ${classLabel}
Evaluation: ${formatEval(move.evalBefore)} → ${formatEval(move.eval)}
${move.bestMove && move.bestMove !== move.uci ? `Best move was: ${move.bestMove}` : 'This was the best move.'}

Reply only with the commentary in ${langName}. No markdown formatting.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return text.trim();
  } catch (err) {
    console.error('Gemini API error:', err);
    return null;
  }
}
