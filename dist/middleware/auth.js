"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const doorDashConfig_1 = __importDefault(require("../config/doorDashConfig"));
const authMiddleware = (req, res, next) => {
    // Allow CORS preflight requests to pass through
    if (req.method === 'OPTIONS') {
        next();
        return;
    }
    const relaySecret = req.headers['x-relay-secret'];
    if (!relaySecret) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Missing X-Relay-Secret header',
        });
        return;
    }
    if (relaySecret !== doorDashConfig_1.default.relaySecret) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid X-Relay-Secret',
        });
        return;
    }
    next();
};
exports.authMiddleware = authMiddleware;
//# sourceMappingURL=auth.js.map