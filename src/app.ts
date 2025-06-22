import express from 'express';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { OpenAIService } from './OpenAIService';
import type { ChatCompletion } from "openai/resources/chat/completions";
import { chatLimiter, authMiddleware, errorHandler, validationMiddleware, requestLogger } from './middlewares';

const app = express();
const port = process.env.PORT || 3000;
const openaiService = new OpenAIService();

// Middleware
app.use(express.json());
app.use(errorHandler);

// Server initialization
app.listen(port, () => console.log(`Server running at http://localhost:${port}`));

app.get('/', (req, res) => {
  res.send('Hello World');
});

const chatMiddlewares: RequestHandler[] = [
  chatLimiter,
  authMiddleware,
  validationMiddleware
];

if (process.env.DEBUG_LOGGING === 'true') {
  console.log('Request logging enabled');
  chatMiddlewares.unshift(requestLogger);
}

// Routes
app.post('/api/chat', chatMiddlewares, async (req: Request, res: Response, next: NextFunction) => {
  const { messages, conversation_id = uuidv4() } = req.body;

  try {
    const answer = await openaiService.completion({ messages }) as ChatCompletion;
    res.json({ ...answer, conversation_id });
  } catch (error) {
    next(error);
  }
});
