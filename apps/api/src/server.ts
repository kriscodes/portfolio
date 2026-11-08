import { app, analytics } from './app.js';
const port = Number(process.env.PORT ?? 3211);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error('PORT must be an integer from 1 to 65535.');
if (process.env.NODE_ENV === 'production') await analytics.ready();
const server = app.listen(port, '0.0.0.0', () =>
  console.log(`Portfolio API listening on http://localhost:${port}`),
);
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, () =>
    server.close(() => {
      analytics.close().finally(() => process.exit(0));
    }),
  );
