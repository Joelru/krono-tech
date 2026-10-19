import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  ADMIN_CREDENTIALS,
  createAdminToken,
  isAuthenticatedAdmin,
} from '@/lib/auth';

export async function GET() {
  if (process.env.VERCEL) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }
  const authenticated = await isAuthenticatedAdmin();
  return NextResponse.json({
    authenticated,
    email: authenticated ? ADMIN_CREDENTIALS.email : null,
  });
}

export async function POST(req: NextRequest) {
  if (process.env.VERCEL) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }
  try {
    const { email, password } = await req.json();

    if (
      String(email).trim().toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase() &&
      String(password) === ADMIN_CREDENTIALS.password
    ) {
      const token = createAdminToken(ADMIN_CREDENTIALS.email);
      const response = NextResponse.json({
        success: true,
        email: ADMIN_CREDENTIALS.email,
      });

      response.cookies.set(ADMIN_COOKIE_NAME, token, {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    }

    return NextResponse.json(
      { error: 'Credenciales de administrador inválidas.' },
      { status: 401 }
    );
  } catch {
    return NextResponse.json({ error: 'Error en solicitud de login.' }, { status: 400 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(ADMIN_COOKIE_NAME);
  return response;
}
