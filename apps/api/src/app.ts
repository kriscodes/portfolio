import express from 'express';
import { projects, type HealthResponse } from '@kristian/contracts';
export const app = express();
app.disable('x-powered-by');
app.get('/api/v1/health', (_request, response) => {
  const body: HealthResponse = { status: 'ok', service: 'portfolio-api', version: 'v1' };
  response.json(body);
});
app.get('/api/v1/projects', (_request, response) => {
  response.json({ data: projects });
});
app.use((_request, response) => {
  response
    .status(404)
    .json({ error: { code: 'NOT_FOUND', message: 'This endpoint does not exist.' } });
});
