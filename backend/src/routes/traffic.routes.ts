import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

function inferPrediction(packetCount: number, byteCount: number, protocol: string) {
  if (packetCount > 800 || byteCount > 90000) {
    return { prediction: 'ddos_attack', confidence: 0.92 };
  }
  if (packetCount > 600 || byteCount > 70000) {
    return { prediction: 'high_risk', confidence: 0.85 };
  }
  if (packetCount > 300 || byteCount > 40000) {
    return { prediction: 'suspicious', confidence: 0.75 };
  }
  if (protocol.toUpperCase() === 'UDP' && packetCount > 200) {
    return { prediction: 'suspicious', confidence: 0.72 };
  }
  return { prediction: 'normal', confidence: 0.95 };
}

// Get all traffic logs
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { sourceIp, severity, limit = 50, offset = 0 } = req.query;

    const where: any = { userId: req.userId };

    if (sourceIp) {
      where.sourceIp = { contains: sourceIp as string };
    }
    if (severity) {
      where.severity = severity as string;
    }

    const logs = await prisma.trafficLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.trafficLog.count({ where });

    res.json({
      data: logs,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch traffic logs' });
  }
});

// Create traffic log (simulated)
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { sourceIp, destinationIp, port, protocol, packetCount, byteCount } = req.body;

    const prediction = inferPrediction(packetCount, byteCount, protocol || 'TCP');

    const log = await prisma.trafficLog.create({
      data: {
        userId: req.userId!,
        sourceIp,
        destinationIp,
        port,
        protocol,
        packetCount,
        byteCount,
        severity: prediction.prediction === 'ddos_attack' ? 'critical' : 
                  prediction.prediction === 'high_risk' ? 'high' :
                  prediction.prediction === 'suspicious' ? 'medium' : 'low',
      },
    });

    // Save prediction
    await prisma.prediction.create({
      data: {
        trafficLogId: log.id,
        prediction: prediction.prediction,
        confidence: prediction.confidence,
        modelVersion: '1.0',
      },
    });

    // Create alert if high risk
    if (prediction.prediction === 'ddos_attack' || prediction.prediction === 'high_risk') {
      await prisma.alert.create({
        data: {
          title: `${prediction.prediction.toUpperCase()} detected`,
          description: `Traffic from ${sourceIp} to ${destinationIp}:${port} classified as ${prediction.prediction}`,
          severity: prediction.prediction === 'ddos_attack' ? 'critical' : 'high',
          trafficLogId: log.id,
        },
      });
    }

    await prisma.activityLog.create({
      data: {
        userId: req.userId!,
        action: 'TRAFFIC_LOG_CREATED',
        description: `Traffic log created for ${sourceIp}`,
        resourceType: 'TrafficLog',
        resourceId: log.id,
      },
    });

    res.status(201).json(log);
  } catch (error: any) {
    console.error('Error creating traffic log:', error);
    res.status(500).json({ error: 'Failed to create traffic log' });
  }
});

// Bulk create simulated traffic
router.post('/simulate', async (req: AuthRequest, res: Response) => {
  try {
    const { count = 10 } = req.body;
    const logs = [];

    for (let i = 0; i < count; i++) {
      const sourceIp = `192.168.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
      const packetCount = Math.floor(Math.random() * 1000) + 10;
      const byteCount = Math.floor(Math.random() * 100000) + 1000;

      let prediction = { prediction: 'normal', confidence: 0.95 };
      if (Math.random() < 0.1) {
        prediction = { prediction: 'suspicious', confidence: 0.7 };
      }
      if (Math.random() < 0.05) {
        prediction = { prediction: 'high_risk', confidence: 0.8 };
      }
      if (Math.random() < 0.02) {
        prediction = { prediction: 'ddos_attack', confidence: 0.9 };
      }

      const log = await prisma.trafficLog.create({
        data: {
          userId: req.userId!,
          sourceIp,
          destinationIp: '10.0.0.1',
          port: Math.floor(Math.random() * 65535) + 1,
          protocol: Math.random() > 0.5 ? 'TCP' : 'UDP',
          packetCount,
          byteCount,
          severity: prediction.prediction === 'ddos_attack' ? 'critical' : 
                    prediction.prediction === 'high_risk' ? 'high' :
                    prediction.prediction === 'suspicious' ? 'medium' : 'low',
        },
      });

      await prisma.prediction.create({
        data: {
          trafficLogId: log.id,
          prediction: prediction.prediction,
          confidence: prediction.confidence,
          modelVersion: '1.0',
        },
      });

      if (prediction.prediction === 'ddos_attack' || prediction.prediction === 'high_risk') {
        await prisma.alert.create({
          data: {
            title: `${prediction.prediction.toUpperCase()} detected`,
            description: `Traffic from ${sourceIp} classified as ${prediction.prediction}`,
            severity: prediction.prediction === 'ddos_attack' ? 'critical' : 'high',
            trafficLogId: log.id,
          },
        });
      }

      logs.push(log);
    }

    await prisma.activityLog.create({
      data: {
        userId: req.userId!,
        action: 'TRAFFIC_SIMULATED',
        description: `Simulated ${count} traffic logs`,
      },
    });

    res.status(201).json({
      message: `${count} traffic logs simulated`,
      data: logs,
    });
  } catch (error: any) {
    console.error('Error simulating traffic:', error);
    res.status(500).json({ error: 'Failed to simulate traffic' });
  }
});

export default router;
