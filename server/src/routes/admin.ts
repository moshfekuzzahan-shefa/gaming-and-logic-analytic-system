import { Router, Request, Response } from 'express';
import { db } from '../db';
import { users } from '../db/schema/users';
import { levels } from '../db/schema/levels';
import { attempts } from '../db/schema/attempts';
import { authenticateToken } from './auth';
import { desc, sql } from 'drizzle-orm';

const router = Router();

// Middleware to verify Admin clearance
export const requireAdmin = (req: Request, res: Response, next: any) => {
  const user = (req as any).user;

  if (!user || user.role?.toLowerCase() !== 'admin') {
    return res.status(403).json({ error: 'Access Denied: Administrative privileges required' });
  }

  next();
};

// GET /api/admin/stats: Return stats and telemetry (Guarded by authenticateToken and requireAdmin)
router.get('/stats', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    // 1. Drizzle SQL Count Queries
    const [usersCountResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users);

    const [levelsCountResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(levels);

    const [attemptsCountResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(attempts);

    // 2. Fetch recent telemetry attempts with relations (joins)
    const recent = await db.query.attempts.findMany({
      limit: 5,
      orderBy: desc(attempts.id),
      with: {
        user: {
          columns: {
            username: true,
          }
        },
        level: {
          columns: {
            name: true,
          }
        }
      }
    } as any) as any[];

    // 3. Return clean payload
    res.json({
      stats: {
        totalUsers: usersCountResult?.count || 0,
        totalLevels: levelsCountResult?.count || 0,
        totalAttempts: attemptsCountResult?.count || 0,
      },
      recentAttempts: recent.map(r => ({
        id: r.id,
        username: r.user?.username || 'Unknown User',
        levelName: r.level?.name || 'Unknown Level',
        timeTaken: r.time_taken,
        isSuccess: r.is_success,
        score: r.score,
      }))
    });

  } catch (error) {
    console.error('Error fetching admin statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
