import type { Board, CastlingRights, Piece, PieceColor, PieceType, Position, ParsedMove } from './types';

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

function pieceFromChar(c: string): Piece | null {
  const map: Record<string, PieceType> = {
    p: 'p', n: 'n', b: 'b', r: 'r', q: 'q', k: 'k',
  };
  const lower = c.toLowerCase();
  if (!map[lower]) return null;
  return { type: map[lower], color: c === lower ? 'b' : 'w' };
}

function pieceToChar(p: Piece): string {
  const c = p.type;
  return p.color === 'w' ? c.toUpperCase() : c;
}

export function parseFen(fen: string): Position {
  const parts = fen.split(' ');
  const rows = parts[0].split('/');
  const board: Board = [];

  for (let r = 0; r < 8; r++) {
    board[r] = [];
    let col = 0;
    for (const ch of rows[r]) {
      if (ch >= '1' && ch <= '8') {
        for (let i = 0; i < parseInt(ch); i++) {
          board[r][col++] = null;
        }
      } else {
        board[r][col++] = pieceFromChar(ch);
      }
    }
  }

  const castling: CastlingRights = {
    K: parts[2].includes('K'),
    Q: parts[2].includes('Q'),
    k: parts[2].includes('k'),
    q: parts[2].includes('q'),
  };

  return {
    board,
    turn: parts[1] as PieceColor,
    castling,
    enPassant: parts[3] === '-' ? null : parts[3],
    halfMoves: parseInt(parts[4]) || 0,
    fullMoves: parseInt(parts[5]) || 1,
  };
}

export function positionToFen(pos: Position): string {
  let fen = '';
  for (let r = 0; r < 8; r++) {
    let empty = 0;
    for (let c = 0; c < 8; c++) {
      const p = pos.board[r][c];
      if (!p) {
        empty++;
      } else {
        if (empty > 0) { fen += empty; empty = 0; }
        fen += pieceToChar(p);
      }
    }
    if (empty > 0) fen += empty;
    if (r < 7) fen += '/';
  }

  let castlingStr = '';
  if (pos.castling.K) castlingStr += 'K';
  if (pos.castling.Q) castlingStr += 'Q';
  if (pos.castling.k) castlingStr += 'k';
  if (pos.castling.q) castlingStr += 'q';
  if (!castlingStr) castlingStr = '-';

  return `${fen} ${pos.turn} ${castlingStr} ${pos.enPassant || '-'} ${pos.halfMoves} ${pos.fullMoves}`;
}

function fileToCol(f: string): number { return f.charCodeAt(0) - 97; }
function rankToRow(r: string): number { return 8 - parseInt(r); }
function colToFile(c: number): string { return String.fromCharCode(97 + c); }
function rowToRank(r: number): string { return String(8 - r); }

function findPiece(
  board: Board,
  type: PieceType,
  color: PieceColor,
  fromFile?: number,
  fromRank?: number,
  toRow?: number,
  toCol?: number
): [number, number] | null {
  for (let r = 0; r < 8; r++) {
    if (fromRank !== undefined && r !== fromRank) continue;
    for (let c = 0; c < 8; c++) {
      if (fromFile !== undefined && c !== fromFile) continue;
      const p = board[r][c];
      if (p && p.type === type && p.color === color) {
        if (toRow !== undefined && toCol !== undefined) {
          if (canReach(board, type, r, c, toRow, toCol)) {
            return [r, c];
          }
        } else {
          return [r, c];
        }
      }
    }
  }
  return null;
}

function canReach(board: Board, type: PieceType, fromR: number, fromC: number, toR: number, toC: number): boolean {
  const dr = toR - fromR;
  const dc = toC - fromC;

  switch (type) {
    case 'n':
      return (Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2);
    case 'b':
      return Math.abs(dr) === Math.abs(dc) && dr !== 0 && isPathClear(board, fromR, fromC, toR, toC);
    case 'r':
      return (dr === 0 || dc === 0) && (dr !== 0 || dc !== 0) && isPathClear(board, fromR, fromC, toR, toC);
    case 'q':
      return ((Math.abs(dr) === Math.abs(dc) && dr !== 0) || (dr === 0 || dc === 0) && (dr !== 0 || dc !== 0))
        && isPathClear(board, fromR, fromC, toR, toC);
    case 'k':
      return Math.abs(dr) <= 1 && Math.abs(dc) <= 1;
    case 'p':
      return true;
    default:
      return false;
  }
}

function isPathClear(board: Board, fromR: number, fromC: number, toR: number, toC: number): boolean {
  const dr = Math.sign(toR - fromR);
  const dc = Math.sign(toC - fromC);
  let r = fromR + dr;
  let c = fromC + dc;
  while (r !== toR || c !== toC) {
    if (board[r][c]) return false;
    r += dr;
    c += dc;
  }
  return true;
}

export function parseSan(san: string, pos: Position): ParsedMove | null {
  const color = pos.turn;
  let s = san.replace(/[+#!?]+$/g, '');

  // Castling
  if (s === 'O-O' || s === '0-0') {
    const row = color === 'w' ? 7 : 0;
    return {
      from: [row, 4], to: [row, 6], piece: 'k',
      san, uci: `e${8 - row}g${8 - row}`,
    };
  }
  if (s === 'O-O-O' || s === '0-0-0') {
    const row = color === 'w' ? 7 : 0;
    return {
      from: [row, 4], to: [row, 2], piece: 'k',
      san, uci: `e${8 - row}c${8 - row}`,
    };
  }

  let promotion: PieceType | undefined;
  const promoMatch = s.match(/=([QRBN])/i);
  if (promoMatch) {
    promotion = promoMatch[1].toLowerCase() as PieceType;
    s = s.replace(/=[QRBN]/i, '');
  }

  const capture = s.includes('x');
  s = s.replace('x', '');

  // Pawn move
  if (s[0] >= 'a' && s[0] <= 'h' && s.length <= 3) {
    const toFile = fileToCol(s[s.length - 2] || s[0]);
    const toRank = rankToRow(s[s.length - 1]);
    let fromFile: number | undefined;

    if (s.length === 3 || (capture && s.length >= 2)) {
      fromFile = fileToCol(s[0]);
    }

    const dir = color === 'w' ? 1 : -1;
    let fromRow: number;

    if (capture || fromFile !== undefined) {
      fromRow = toRank + dir;
      if (fromFile === undefined) fromFile = toFile;
    } else {
      fromRow = toRank + dir;
      if (!pos.board[fromRow]?.[toFile] || pos.board[fromRow][toFile]?.type !== 'p') {
        fromRow = toRank + dir * 2;
      }
    }

    return {
      from: [fromRow, fromFile ?? toFile], to: [toRank, toFile],
      piece: 'p', promotion, capture,
      san, uci: `${colToFile(fromFile ?? toFile)}${rowToRank(fromRow)}${colToFile(toFile)}${rowToRank(toRank)}${promotion || ''}`,
    };
  }

  // Piece move
  const pieceType = s[0].toLowerCase() as PieceType;
  const destStr = s.slice(-2);
  const toCol = fileToCol(destStr[0]);
  const toRow = rankToRow(destStr[1]);
  const disambig = s.slice(1, -2);

  let fromFile: number | undefined;
  let fromRank: number | undefined;

  if (disambig.length === 1) {
    if (disambig >= 'a' && disambig <= 'h') fromFile = fileToCol(disambig);
    else fromRank = rankToRow(disambig);
  } else if (disambig.length === 2) {
    fromFile = fileToCol(disambig[0]);
    fromRank = rankToRow(disambig[1]);
  }

  const from = findPiece(pos.board, pieceType, color, fromFile, fromRank, toRow, toCol);
  if (!from) return null;

  return {
    from, to: [toRow, toCol],
    piece: pieceType, capture,
    san, uci: `${colToFile(from[1])}${rowToRank(from[0])}${colToFile(toCol)}${rowToRank(toRow)}`,
  };
}

export function applyMove(pos: Position, move: ParsedMove): Position {
  const board: Board = pos.board.map(row => [...row]);
  const castling = { ...pos.castling };
  let enPassant: string | null = null;

  const [fromR, fromC] = move.from;
  const [toR, toC] = move.to;
  const piece = board[fromR][fromC];

  board[toR][toC] = move.promotion
    ? { type: move.promotion, color: pos.turn }
    : piece;
  board[fromR][fromC] = null;

  // Castling - move rook
  if (move.piece === 'k') {
    if (toC - fromC === 2) {
      board[fromR][5] = board[fromR][7];
      board[fromR][7] = null;
    } else if (fromC - toC === 2) {
      board[fromR][3] = board[fromR][0];
      board[fromR][0] = null;
    }
    if (pos.turn === 'w') { castling.K = false; castling.Q = false; }
    else { castling.k = false; castling.q = false; }
  }

  // Update castling rights on rook moves/captures
  if (move.piece === 'r') {
    if (fromR === 7 && fromC === 7) castling.K = false;
    if (fromR === 7 && fromC === 0) castling.Q = false;
    if (fromR === 0 && fromC === 7) castling.k = false;
    if (fromR === 0 && fromC === 0) castling.q = false;
  }
  if (toR === 0 && toC === 7) castling.k = false;
  if (toR === 0 && toC === 0) castling.q = false;
  if (toR === 7 && toC === 7) castling.K = false;
  if (toR === 7 && toC === 0) castling.Q = false;

  // En passant capture
  if (move.piece === 'p' && pos.enPassant) {
    const epCol = fileToCol(pos.enPassant[0]);
    const epRow = rankToRow(pos.enPassant[1]);
    if (toR === epRow && toC === epCol) {
      board[fromR][toC] = null;
    }
  }

  // Set en passant square for double pawn push
  if (move.piece === 'p' && Math.abs(toR - fromR) === 2) {
    const epR = (fromR + toR) / 2;
    enPassant = `${colToFile(fromC)}${rowToRank(epR)}`;
  }

  const halfMoves = (move.piece === 'p' || move.capture) ? 0 : pos.halfMoves + 1;
  const fullMoves = pos.turn === 'b' ? pos.fullMoves + 1 : pos.fullMoves;

  return {
    board,
    turn: pos.turn === 'w' ? 'b' : 'w',
    castling,
    enPassant,
    halfMoves,
    fullMoves,
  };
}

export function parsePgn(pgn: string): string[] {
  let cleaned = pgn
    .replace(/\{[^}]*\}/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\$\d+/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\d+\.\.\./g, '')
    .replace(/\d+\./g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Remove result
  cleaned = cleaned.replace(/\s*(1-0|0-1|1\/2-1\/2|\*)\s*$/, '');

  return cleaned.split(' ').filter(m => m.length > 0);
}

export function pgnToFens(pgn: string): { fens: string[]; sans: string[]; ucis: string[] } {
  const moves = parsePgn(pgn);
  let pos = parseFen(INITIAL_FEN);
  const fens: string[] = [INITIAL_FEN];
  const sans: string[] = [];
  const ucis: string[] = [];

  for (const san of moves) {
    const parsed = parseSan(san, pos);
    if (!parsed) {
      console.warn(`Failed to parse move: ${san}`);
      break;
    }
    pos = applyMove(pos, parsed);
    fens.push(positionToFen(pos));
    sans.push(san);
    ucis.push(parsed.uci);
  }

  return { fens, sans, ucis };
}
