export type PieceColor = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export interface Piece {
  type: PieceType;
  color: PieceColor;
}

export type Board = (Piece | null)[][];

export interface CastlingRights {
  K: boolean;
  Q: boolean;
  k: boolean;
  q: boolean;
}

export interface Position {
  board: Board;
  turn: PieceColor;
  castling: CastlingRights;
  enPassant: string | null;
  halfMoves: number;
  fullMoves: number;
}

export interface ParsedMove {
  from: [number, number];
  to: [number, number];
  piece: PieceType;
  promotion?: PieceType;
  capture?: boolean;
  san: string;
  uci: string;
}

export interface AnalyzedMove {
  moveNumber: number;
  color: PieceColor;
  san: string;
  uci: string;
  fenBefore: string;
  fenAfter: string;
  eval?: number | null;
  evalBefore?: number | null;
  bestMove?: string;
  classification?: MoveClassification;
}

export type MoveClassification =
  | 'brilliant'
  | 'great'
  | 'good'
  | 'book'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder';

export interface GameResult {
  moves: AnalyzedMove[];
  whiteAccuracy: number;
  blackAccuracy: number;
  stats: {
    white: ClassificationCounts;
    black: ClassificationCounts;
  };
}

export interface ClassificationCounts {
  brilliant: number;
  great: number;
  good: number;
  book: number;
  inaccuracy: number;
  mistake: number;
  blunder: number;
}

export interface CloudEvalResponse {
  fen: string;
  knodes: number;
  depth: number;
  pvs: {
    moves: string;
    cp?: number;
    mate?: number;
  }[];
}

export interface ChessComGame {
  url: string;
  pgn: string;
  time_control: string;
  end_time: number;
  rated: boolean;
  time_class: string;
  rules: string;
  white: {
    username: string;
    rating: number;
    result: string;
  };
  black: {
    username: string;
    rating: number;
    result: string;
  };
}

export interface ChessComArchive {
  archives: string[];
}
