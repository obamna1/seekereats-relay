import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import config from './config/doorDashConfig';
import { authMiddleware } from './middleware/auth';
import relayRoutes from './routes/relay';
import twilioRoutes from './routes/twilio';
import restaurantRoutes from './routes/restaurants';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Twilio sends form-urlencoded data

// Root endpoint - API info
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    api: 'SeekerEats Relay API',
    status: 'online',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      restaurants: 'GET /restaurants',
      restaurantDetails: 'GET /restaurants/:id',
      quote: 'POST /relay/delivery',
      acceptQuote: 'POST /relay/delivery/{id}/accept',
      deliveryStatus: 'GET /relay/delivery/{id}',
      phoneCall: 'POST /relay/order-call',
      callStatus: 'GET /relay/order-call/{call_sid}/status',
      config: 'GET /relay/config',
      twiml: 'POST /twilio/twiml'
    },
    note: 'All /relay endpoints require X-Relay-Secret header'
  });
});

// Health check endpoint (no auth required)
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public restaurant routes (no auth required)
app.use('/restaurants', restaurantRoutes);

// Public Twilio routes (no auth required)
app.use('/twilio', twilioRoutes);

// Public Waitlist routes
import waitlistRoutes from './routes/waitlist';
app.use('/waitlist', waitlistRoutes);

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
