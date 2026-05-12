import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// Get all reports
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { type, limit = 50, offset = 0 } = req.query;

    const where: any = {};

    if (type) {
      where.type = type as string;
    }

    const reports = await prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.report.count({ where });

    res.json({
      data: reports,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Get report by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const report = await prisma.report.findUnique({
      where: { id: req.params.id },
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// Generate traffic summary report
router.post('/generate/traffic-summary', async (req: AuthRequest, res: Response) => {
  try {
    const logs = await prisma.trafficLog.findMany({
      where: { userId: req.userId },
    });

    const predictions = await prisma.prediction.findMany({
      orderBy: { timestamp: 'desc' },
      take: 1000,
    });

    const severityCounts = {
      critical: logs.filter(l => l.severity === 'critical').length,
      high: logs.filter(l => l.severity === 'high').length,
      medium: logs.filter(l => l.severity === 'medium').length,
      low: logs.filter(l => l.severity === 'low').length,
    };

    const predictionCounts = predictions.reduce((acc: any, p) => {
      acc[p.prediction] = (acc[p.prediction] || 0) + 1;
      return acc;
    }, {});

    const totalBytes = logs.reduce((sum, log) => sum + log.byteCount, 0);
    const totalPackets = logs.reduce((sum, log) => sum + log.packetCount, 0);

    const report = await prisma.report.create({
      data: {
        title: 'Traffic Summary Report',
        description: `Traffic summary report generated on ${new Date().toLocaleDateString()}`,
        type: 'traffic_summary',
        data: {
          totalLogs: logs.length,
          severityCounts,
          predictionCounts,
          totalBytes,
          totalPackets,
          averageBytesPerLog: logs.length > 0 ? totalBytes / logs.length : 0,
          generatedAt: new Date(),
        },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.userId!,
        action: 'REPORT_GENERATED',
        description: 'Traffic summary report generated',
        resourceType: 'Report',
        resourceId: report.id,
      },
    });

    res.status(201).json(report);
  } catch (error: any) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Generate security analysis report
router.post('/generate/security-analysis', async (req: AuthRequest, res: Response) => {
  try {
    const alerts = await prisma.alert.findMany({});
    const incidents = await prisma.incident.findMany({});
    const predictions = await prisma.prediction.findMany({});

    const severityBreakdown = {
      critical: alerts.filter(a => a.severity === 'critical').length,
      high: alerts.filter(a => a.severity === 'high').length,
      medium: alerts.filter(a => a.severity === 'medium').length,
      low: alerts.filter(a => a.severity === 'low').length,
    };

    const statusBreakdown = {
      active: alerts.filter(a => a.status === 'active').length,
      acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
      resolved: alerts.filter(a => a.status === 'resolved').length,
    };

    const report = await prisma.report.create({
      data: {
        title: 'Security Analysis Report',
        description: `Security analysis report generated on ${new Date().toLocaleDateString()}`,
        type: 'security_analysis',
        data: {
          totalAlerts: alerts.length,
          totalIncidents: incidents.length,
          severityBreakdown,
          statusBreakdown,
          averageConfidence: predictions.length > 0 
            ? predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length 
            : 0,
          generatedAt: new Date(),
        },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.userId!,
        action: 'REPORT_GENERATED',
        description: 'Security analysis report generated',
        resourceType: 'Report',
        resourceId: report.id,
      },
    });

    res.status(201).json(report);
  } catch (error: any) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Download report as CSV
router.get('/:id/download', async (req: AuthRequest, res: Response) => {
  try {
    const report = await prisma.report.findUnique({
      where: { id: req.params.id },
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const csv = JSON.stringify(report.data, null, 2);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="report-${report.id}.json"`
    );
    res.send(csv);

    await prisma.activityLog.create({
      data: {
        userId: req.userId!,
        action: 'REPORT_DOWNLOADED',
        description: `Report ${report.id} downloaded`,
        resourceType: 'Report',
        resourceId: report.id,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to download report' });
  }
});

export default router;
