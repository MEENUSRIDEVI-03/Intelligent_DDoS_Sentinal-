import { WebSocketServer, WebSocket } from 'ws';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function setupWebSocket(wss: WebSocketServer) {
  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected to WebSocket');

    // Send initial message
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to WebSocket server',
      timestamp: new Date(),
    }));

    // Simulate real-time data
    const interval = setInterval(async () => {
      try {
        // Get latest stats
        const totalRequests = await prisma.trafficLog.count();
        const activeAlerts = await prisma.alert.count({
          where: { status: 'active' },
        });

        const lastHour = new Date(Date.now() - 60 * 60 * 1000);
        const requestsLastHour = await prisma.trafficLog.count({
          where: {
            timestamp: { gte: lastHour },
          },
        });

        ws.send(JSON.stringify({
          type: 'stats_update',
          data: {
            totalRequests,
            activeAlerts,
            requestsLastHour,
            timestamp: new Date(),
          },
        }));
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    }, 5000); // Update every 5 seconds

    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
      clearInterval(interval);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clearInterval(interval);
    });
  });
}
