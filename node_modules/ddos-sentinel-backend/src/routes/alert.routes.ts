import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// Get all alerts
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, severity, limit = 50, offset = 0 } = req.query;

    const where: any = {};

    if (status) {
      where.status = status as string;
    }
    if (severity) {
      where.severity = severity as string;
    }

    const alerts = await prisma.alert.findMany({
      where,
      include: {
        incidents: true,
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.alert.count({ where });

    res.json({
      data: alerts,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Get alert by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const alert = await prisma.alert.findUnique({
      where: { id: req.params.id },
      include: {
        incidents: true,
      },
    });

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json(alert);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch alert' });
  }
});

// Update alert status
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;

    const alert = await prisma.alert.update({
      where: { id: req.params.id },
      data: {
        status,
        resolvedAt: status === 'resolved' ? new Date() : null,
      },
      include: {
        incidents: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.userId!,
        action: 'ALERT_UPDATED',
        description: `Alert status updated to ${status}`,
        resourceType: 'Alert',
        resourceId: alert.id,
      },
    });

    res.json(alert);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

// Create incident
router.post('/:id/incidents', async (req: AuthRequest, res: Response) => {
  try {
    const { description } = req.body;

    const alert = await prisma.alert.findUnique({
      where: { id: req.params.id },
    });

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const incident = await prisma.incident.create({
      data: {
        alertId: req.params.id,
        description,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.userId!,
        action: 'INCIDENT_CREATED',
        description,
        resourceType: 'Incident',
        resourceId: incident.id,
      },
    });

    res.status(201).json(incident);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create incident' });
  }
});

// Update incident
router.patch('/:id/incidents/:incidentId', async (req: AuthRequest, res: Response) => {
  try {
    const { status, resolution } = req.body;

    const incident = await prisma.incident.update({
      where: { id: req.params.incidentId },
      data: {
        status,
        resolution,
        resolvedAt: status === 'resolved' ? new Date() : null,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.userId!,
        action: 'INCIDENT_UPDATED',
        description: `Incident status updated to ${status}`,
        resourceType: 'Incident',
        resourceId: incident.id,
      },
    });

    res.json(incident);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update incident' });
  }
});

export default router;
