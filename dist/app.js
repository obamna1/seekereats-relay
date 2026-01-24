"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Express app module - separated from server startup for testing
 */
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_1 = require("./middleware/auth");
const relay_1 = __importDefault(require("./routes/relay"));
const twilio_1 = __importDefault(require("./routes/twilio"));
const restaurants_1 = __importDefault(require("./routes/restaurants"));
const waitlist_1 = __importDefault(require("./routes/waitlist"));
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Root endpoint - API info
app.get('/', (req, res) => {
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
            twiml: 'POST /twilio/twiml',
        },
        note: 'All /relay endpoints require X-Relay-Secret header',
    });
});
// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Public restaurant routes (no auth required)
app.use('/restaurants', restaurants_1.default);
// Public Twilio routes (no auth required)
app.use('/twilio', twilio_1.default);
// Public Waitlist routes
app.use('/waitlist', waitlist_1.default);
// Protected relay routes
app.use('/relay', auth_1.authMiddleware, relay_1.default);
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
    });
});
// Error handler
app.use((err, req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message || 'An unexpected error occurred',
    });
});
exports.default = app;
//# sourceMappingURL=app.js.map