import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { SuperAdminService } from './services/superAdminService.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin/index.js';
import tenantRoutes from './routes/tenant/index.js';
import storefrontRoutes from './routes/storefront/index.js';

const app = express();

// Initialize super admin
SuperAdminService.initializeSuperAdmin().catch(console.error);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/:tenant_slug/admin', tenantRoutes);
app.use('/api/:tenant_slug/storefront', storefrontRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    statusCode: 404,
  });
});

// Error handler
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`🚀 Server running on http://localhost:${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

export default app;
