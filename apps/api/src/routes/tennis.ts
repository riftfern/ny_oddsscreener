import { createHash, timingSafeEqual } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Router, type Request, type Response, type Router as RouterType } from 'express';
import type { TennisLockerBoard } from '@ny-sharp-edge/shared';

const router: RouterType = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function tokenOk(given: unknown, expected: string): boolean {
  if (!expected || typeof given !== 'string' || given.length === 0) return false;
  const a = createHash('sha256').update(given).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

function extractToken(req: Request): string | undefined {
  const q = req.query.k;
  if (typeof q === 'string' && q.length > 0) return q;
  const header = req.header('x-tennis-token');
  if (header && header.length > 0) return header;
  return undefined;
}

export function picksFilePath(): string {
  if (process.env.TENNIS_PICKS_PATH) return process.env.TENNIS_PICKS_PATH;
  return join(__dirname, '..', '..', 'picks', 'tennis.json');
}

function loadBoard(): TennisLockerBoard | null {
  const file = picksFilePath();
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as TennisLockerBoard;
  } catch {
    return null;
  }
}

function deny(res: Response): void {
  // Same shape as a missing route — do not advertise that a locker exists.
  res.status(404).json({ error: 'Not found' });
}

// GET /api/tennis/picks?k=TOKEN
router.get('/picks', (req, res) => {
  const expected = process.env.TENNIS_LOCKER_TOKEN ?? '';
  if (!tokenOk(extractToken(req), expected)) {
    deny(res);
    return;
  }

  const board = loadBoard();
  if (!board) {
    res.status(200).json({
      generatedAt: new Date().toISOString(),
      dataThrough: {},
      ingestedLive: { atp: 0, wta: 0 },
      totalMatches: 0,
      playersRated: 0,
      matchCount: 0,
      pickCount: 0,
      matches: [],
      picks: [],
      disclaimer: 'Model has not published a board yet.',
    } satisfies TennisLockerBoard);
    return;
  }

  res.json(board);
});

export default router;
