import type { ChessComGame } from '../engine/types';

const BASE_URL = 'https://api.chess.com/pub';

export async function getPlayerArchives(username: string): Promise<string[]> {
  const res = await fetch(`${BASE_URL}/player/${username.toLowerCase()}/games/archives`);
  if (!res.ok) throw new Error(`Player "${username}" not found`);
  const data = await res.json();
  return data.archives || [];
}

export async function getGamesFromArchive(archiveUrl: string): Promise<ChessComGame[]> {
  const res = await fetch(archiveUrl);
  if (!res.ok) throw new Error('Failed to fetch games');
  const data = await res.json();
  return data.games || [];
}

export async function getRecentGames(username: string, count: number = 20): Promise<ChessComGame[]> {
  const archives = await getPlayerArchives(username);
  if (archives.length === 0) return [];

  const games: ChessComGame[] = [];
  for (let i = archives.length - 1; i >= 0 && games.length < count; i--) {
    const monthGames = await getGamesFromArchive(archives[i]);
    games.push(...monthGames);
    if (games.length >= count) break;
  }

  return games
    .sort((a, b) => b.end_time - a.end_time)
    .slice(0, count);
}

export async function getGameByUrl(url: string): Promise<ChessComGame | null> {
  const match = url.match(/chess\.com\/(?:game\/)?(?:live|daily)\/(\d+)/);
  if (!match) return null;

  const gameId = match[1];
  const callbackUrl = `https://www.chess.com/callback/live/game/${gameId}`;

  try {
    const res = await fetch(callbackUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.pgn) {
        return {
          url,
          pgn: data.pgn,
          time_control: data.timeControl || '',
          end_time: Date.now() / 1000,
          rated: true,
          time_class: data.timeClass || 'unknown',
          rules: 'chess',
          white: {
            username: data.players?.top?.username || data.pgnHeaders?.White || 'White',
            rating: data.players?.top?.rating || data.pgnHeaders?.WhiteElo || 0,
            result: '',
          },
          black: {
            username: data.players?.bottom?.username || data.pgnHeaders?.Black || 'Black',
            rating: data.players?.bottom?.rating || data.pgnHeaders?.BlackElo || 0,
            result: '',
          },
        } as ChessComGame;
      }
    }
  } catch {
    // fallback below
  }

  return null;
}

export function formatTimeControl(tc: string): string {
  const parts = tc.split('+');
  const base = parseInt(parts[0]);
  const inc = parts[1] ? parseInt(parts[1]) : 0;

  if (base >= 86400) return `${Math.floor(base / 86400)}d`;
  const mins = Math.floor(base / 60);
  return inc > 0 ? `${mins}+${inc}` : `${mins} min`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString();
}
