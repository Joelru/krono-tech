import crypto from 'crypto';
import { cookies } from 'next/headers';

const ADMIN_COOKIE_NAME = 'krono_admin_session';
const SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'krono-tech-ultra-secret-key-colombia-2026';

export const ADMIN_CREDENTIALS = {
  email: process.env.ADMIN_EMAIL || 'admin@kronotech.co',
  password: process.env.ADMIN_PASSWORD || 'KronoAdmin2026',
};

export function createAdminToken(email: string): string {
  const payload = JSON.stringify({
    email,
    role: 'owner',
    iat: Date.now(),
  });
  const base64Payload = Buffer.from(payload).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(base64Payload)
    .digest('base64url');
  return `${base64Payload}.${signature}`;
}

export function verifyAdminToken(token: string | undefined): boolean {
  if (!token || !token.includes('.')) return false;
  const [base64Payload, signature] = token.split('.');
  if (!base64Payload || !signature) return false;

  const expectedSignature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(base64Payload)
    .digest('base64url');

  if (signature !== expectedSignature) return false;

  try {
    const payload = JSON.parse(Buffer.from(base64Payload, 'base64url').toString('utf8'));
    return payload.role === 'owner';
  } catch {
    return false;
  }
}

export async function isAuthenticatedAdmin(): Promise<boolean> {
  if (process.env.VERCEL) {
    return false;
  }
  // En el PC local del dueño (localhost), acceso directo autorizado sin bloqueos
  return true;
}

export { ADMIN_COOKIE_NAME };
