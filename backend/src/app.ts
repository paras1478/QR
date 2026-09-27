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

// Render (and most PaaS hosts) sit behind a reverse proxy, so Express must be
// told to trust the X-Forwarded-* headers it sets. This must run before
// express-rate-limit, which reads X-Forwarded-For to key rate limits and
// throws ERR_ERL_UNEXPECTED_X_FORWARDED_FOR otherwise. "1" trusts exactly one
// hop (the platform's own proxy), which is correct for Render/Heroku-style
// single-proxy deployments — it does NOT blindly trust arbitrary client-sent
// headers beyond that one hop.
app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin(origin, callback) {
      // Same-origin/non-browser requests (curl, server-to-server) send no Origin header.
      if (!origin || env.allowedOrigins.includes(origin.replace(/\/$/, ''))) {
        return callback(null, true);
      }
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
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
