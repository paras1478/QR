import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { apiLimiter } from './middleware/rateLimit.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import authRoutes from './routes/auth.routes';
import fileRoutes from './routes/file.routes';
import shareRoutes from './routes/share.routes';
import diagnosticsRoutes from './routes/diagnostics.routes';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/diagnostics', diagnosticsRoutes);

app.use('/api', notFoundHandler);
app.use(errorHandler);

export default app;
