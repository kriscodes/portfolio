import express from 'express';
import { projects, type HealthResponse } from '@kristian/contracts';
import { createAnalytics } from './analytics/router.js';
export const analytics = createAnalytics();
export const app = express();
app.disable('x-powered-by');
// Render appends the actual client at its single ingress hop; never trust forwarded
// addresses when the app is run directly outside that managed environment.
app.set('trust proxy', process.env.RENDER === 'true' ? 1 : false);
app.get('/api/v1/health', async (_request, response) => {
  if (analytics.configured || process.env.NODE_ENV === 'production') {
    try {
      await analytics.ready();
    } catch {
      response.status(503).json({ status: 'unavailable', service: 'portfolio-api', version: 'v1' });
      return;
    }
  }
  const body: HealthResponse = { status: 'ok', service: 'portfolio-api', version: 'v1' };
  response.json(body);
});
app.get('/api/v1/projects', (_request, response) => {
  response.json({ data: projects });
});
app.use(analytics.router);
app.use((_request, response) => {
  response
    .status(404)
    .json({ error: { code: 'NOT_FOUND', message: 'This endpoint does not exist.' } });
});
