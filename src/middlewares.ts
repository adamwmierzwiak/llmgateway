import type { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';

export const chatLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: 6,
  keyGenerator: (req) => {
    const forwardedFor = req.headers['x-forwarded-for'];
    return (typeof forwardedFor === 'string'
      ? forwardedFor.split(',')[0]
      : req.socket.remoteAddress) || '127.0.0.1';
  },
  handler: (req, res) => {
    return res.status(429).json({ error: 'Too many requests' });
  },
  skipFailedRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void | Response => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  if (!token || token !== process.env.PERSONAL_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  next();
};

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error in request processing:', err);
  res.status(500).json({ error: 'An error occurred while processing your request' });
};

interface Message {
  content: string | object[];
  role: 'user' | 'assistant' | 'system';
}

export const validationMiddleware = (req: Request, res: Response, next: NextFunction): void | Response => {
  const { messages } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Invalid request: messages must be a non-empty array' });
  }

  const isValidMessage = (msg: any): boolean => {
    if (!msg || typeof msg !== 'object') {
      return false;
    }
    const hasValidRole = msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system';
    if (!hasValidRole) {
      return false;
    }
    if (typeof msg.content === 'string' && msg.content.trim() !== '') {
      return true;
    }
    if (Array.isArray(msg.content) && msg.content.length > 0) {
      return true;
    }
    return false;
  };

  if (!messages.every(isValidMessage)) {
    return res.status(400).json({ error: 'Invalid request: each message must have a valid role and non-empty content.' });
  }

  next();
};

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const timestamp = new Date().toISOString();
  const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  console.log('\n=== INCOMING REQUEST LOG ===');
  console.log(`Timestamp: ${timestamp}`);
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.url}`);
  console.log(`Client IP: ${clientIP}`);
  console.log(`User-Agent: ${userAgent}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('Query params:', JSON.stringify(req.query, null, 2));
  console.log('=== END REQUEST LOG ===\n');

  next();
};
