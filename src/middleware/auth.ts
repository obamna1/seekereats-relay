import { Request, Response, NextFunction } from 'express';
import config from '../config/doorDashConfig';

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const relaySecret = req.headers['x-relay-secret'];

  if (!relaySecret) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing X-Relay-Secret header',
    });
    return;
  }

  if (relaySecret !== config.relaySecret) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid X-Relay-Secret',
    });
    return;
  }

  next();
};
