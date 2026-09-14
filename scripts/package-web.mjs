import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const output = fileURLToPath(new URL('../out/', import.meta.url));
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(fileURLToPath(new URL('../apps/web/out/', import.meta.url)), output, { recursive: true });
console.log('Static frontend ready in out/. The Express API is a separate deployment.');
