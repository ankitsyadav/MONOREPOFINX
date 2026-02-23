import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import authRoutes from './modules/auth/auth.routes.js';
import credentialRoutes from './modules/credential/credential.routes.js';
import campaignRoutes from './modules/campaign/campaign.routes.js';
import webhookRoutes from './modules/webhook/webhook.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json({ limit: '5mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.get('/health', (_, res) => res.status(200).json({ status: 'ok' }));

app.use('/auth', authRoutes);
app.use('/credentials', credentialRoutes);
app.use('/campaigns', campaignRoutes);
app.use('/webhook', webhookRoutes);
app.use('/dashboard', dashboardRoutes);

app.use((_, res) => res.status(404).json({ message: 'Route not found' }));
app.use(errorHandler);

export default app;
