import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import authRoutes from './routes/auth.routes';
import trafficRoutes from './routes/traffic.routes';
import alertRoutes from './routes/alert.routes';
import reportRoutes from './routes/report.routes';
import dashboardRoutes from './routes/dashboard.routes';
import intelRoutes from './routes/intel.routes';
import { authMiddleware } from './middleware/auth.middleware';
import { errorHandler } from './middleware/error.middleware';
import { setupWebSocket } from './services/websocket.service';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/traffic', authMiddleware, trafficRoutes);
app.use('/api/alerts', authMiddleware, alertRoutes);
app.use('/api/reports', authMiddleware, reportRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/intel', authMiddleware, intelRoutes);

// Error handling
app.use(errorHandler);

// WebSocket setup
const server = createServer(app);
const wss = new WebSocketServer({ server });
setupWebSocket(wss);

server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server is ready`);
});

export default app;
