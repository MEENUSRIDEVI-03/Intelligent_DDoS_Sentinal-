import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// Get dashboard stats
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
    const lastDay = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      totalRequests,
      requestsLastHour,
      suspiciousTraffic,
      activeAlerts,
      criticalAlerts,
    ] = await Promise.all([
      prisma.trafficLog.count({ where: { userId: req.userId } }),
      prisma.trafficLog.count({
        where: {
          userId: req.userId,
          timestamp: { gte: lastHour },
        },
      }),
      prisma.trafficLog.count({
        where: {
          userId: req.userId,
          severity: { in: ['high', 'critical'] },
        },
      }),
      prisma.alert.count({
        where: { status: 'active' },
      }),
      prisma.alert.count({
        where: { severity: 'critical', status: 'active' },
      }),
    ]);

    const averageConfidence = await prisma.prediction.aggregate({
      _avg: {
        confidence: true,
      },
    });

    res.json({
      totalRequests,
      requestsLastHour,
      suspiciousTraffic,
      activeAlerts,
      criticalAlerts,
      averageConfidence: averageConfidence._avg.confidence || 0,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Get traffic trend (last 7 days)
router.get('/traffic-trend', async (req: AuthRequest, res: Response) => {
  try {
    const days = 7;
    const trend = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await prisma.trafficLog.count({
        where: {
          userId: req.userId,
          timestamp: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      trend.push({
        date: date.toISOString().split('T')[0],
        requests: count,
      });
    }

    res.json(trend);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch traffic trend' });
  }
});

// Get severity distribution
router.get('/severity-distribution', async (req: AuthRequest, res: Response) => {
  try {
    const [normal, medium, high, critical] = await Promise.all([
      prisma.trafficLog.count({
        where: { userId: req.userId, severity: 'low' },
      }),
      prisma.trafficLog.count({
        where: { userId: req.userId, severity: 'medium' },
      }),
      prisma.trafficLog.count({
        where: { userId: req.userId, severity: 'high' },
      }),
      prisma.trafficLog.count({
        where: { userId: req.userId, severity: 'critical' },
      }),
    ]);

    res.json({
      normal,
      medium,
      high,
      critical,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch severity distribution' });
  }
});

// Get prediction distribution
router.get('/prediction-distribution', async (req: AuthRequest, res: Response) => {
  try {
    const predictions = await prisma.prediction.groupBy({
      by: ['prediction'],
      _count: {
        id: true,
      },
    });

    const distribution = predictions.reduce((acc: any, p) => {
      acc[p.prediction] = p._count.id;
      return acc;
    }, {});

    res.json(distribution);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch prediction distribution' });
  }
});

// Get recent alerts
router.get('/recent-alerts', async (req: AuthRequest, res: Response) => {
  try {
    const alerts = await prisma.alert.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        incidents: {
          take: 1,
        },
      },
    });

    res.json(alerts);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch recent alerts' });
  }
});

// Get activity logs
router.get('/activity-logs', async (req: AuthRequest, res: Response) => {
  try {
    const logs = await prisma.activityLog.findMany({
      where: { userId: req.userId },
      take: 20,
      orderBy: { timestamp: 'desc' },
    });

    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

export default router;
