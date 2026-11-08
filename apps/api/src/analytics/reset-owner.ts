// Recovery is deliberately an operator command, never an unauthenticated HTTP endpoint.
// Send the new password on stdin from a private Render shell, not as a command argument.
import { Pool } from 'pg';
import { hashPassword } from './auth.js';

const connectionString = process.env.DATABASE_URL;
const email = process.env.ANALYTICS_OWNER_EMAIL?.trim().toLowerCase();
if (!connectionString || !email)
  throw new Error('Configure DATABASE_URL and ANALYTICS_OWNER_EMAIL.');
if (process.stdin.isTTY)
  throw new Error('Read the new password privately, then pipe it to this command on stdin.');

let password = '';
for await (const chunk of process.stdin) {
  password += chunk.toString();
  if (password.length > 130) throw new Error('The new password must contain 14 to 128 characters.');
}
password = password.replace(/\r?\n$/, '');
if (password.length < 14 || password.length > 128)
  throw new Error('The new password must contain 14 to 128 characters.');

const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 8000 });
const client = await pool.connect();
try {
  const hash = await hashPassword(password);
  password = '';
  await client.query('BEGIN');
  const result = await client.query(
    'UPDATE analytics_owner SET password_hash = $1 WHERE id = 1 AND email = $2 RETURNING id',
    [hash, email],
  );
  if (result.rowCount !== 1) throw new Error('The configured owner account was not found.');
  await client.query('DELETE FROM analytics_sessions');
  await client.query('COMMIT');
  console.log('Owner password updated. All existing dashboard sessions have been signed out.');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
  await pool.end();
}
