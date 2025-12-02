import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import config from './config/doorDashConfig';
import { authMiddleware } from './middleware/auth';
import relayRoutes from './routes/relay';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint (no auth required)
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Protected relay routes
app.use('/relay', authMiddleware, relayRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
  });
});

// Start server
const port = config.port;
app.listen(port, () => {
  console.log(`🚀 SeekerEats Relay API listening on port ${port}`);
  console.log(`📝 DoorDash Developer ID: ${config.developerId.substring(0, 8)}...`);
  console.log(`✅ Server ready for deliveries`);
});
