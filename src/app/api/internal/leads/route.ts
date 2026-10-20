import { NextRequest, NextResponse } from 'next/server';
import { getAdminOrders, getAdminQuotes } from '@/lib/db';

export const dynamic = 'force-dynamic';

const INTERNAL_SYNC_TOKEN =
  process.env.ADMIN_SECRET_KEY || 'krono-tech-ultra-secret-key-colombia-2026';

export async function GET(req: NextRequest) {
  const token = req.headers.get('x-krono-sync-key');
  if (token !== INTERNAL_SYNC_TOKEN) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  return NextResponse.json({
    orders: getAdminOrders(),
    quotes: getAdminQuotes(),
  });
}
