import { NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/auth';
import {
  getAdminOrders,
  getAdminProducts,
  getAdminQuotes,
  getCategories,
  getStoreSettings,
  mergeRemoteLeads,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

const INTERNAL_SYNC_TOKEN =
  process.env.ADMIN_SECRET_KEY || 'krono-tech-ultra-secret-key-colombia-2026';

export async function GET() {
  const isAdmin = await isAuthenticatedAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'No autorizado. Inicia sesión como Administrador.' },
      { status: 401 }
    );
  }

  // If running locally on the owner's PC, silently pull any recent orders/quotes from kronotech.vercel.app
  if (!process.env.VERCEL) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const remoteRes = await fetch('https://kronotech.vercel.app/api/internal/leads', {
        headers: { 'x-krono-sync-key': INTERNAL_SYNC_TOKEN },
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (remoteRes.ok) {
        const remoteData = await remoteRes.json();
        mergeRemoteLeads(remoteData.orders || [], remoteData.quotes || []);
      }
    } catch {
      // Ignore network/offline errors when working offline
    }
  }

  const products = getAdminProducts();
  const orders = getAdminOrders();
  const quotes = getAdminQuotes();
  const categories = getCategories();
  const settings = getStoreSettings();

  // Calculate Dashboard Metrics (excluding cancelled orders)
  const validOrders = orders.filter((o) => o.status !== 'cancelled');
  const monthlyRevenue = validOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const estimatedNetProfit = validOrders.reduce((sum, o) => sum + o.estimated_profit, 0);
  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;
  const deliveredOrdersCount = orders.filter((o) => o.status === 'delivered').length;
  const newQuotesCount = quotes.filter((q) => q.status === 'nueva').length;

  return NextResponse.json({
    products,
    orders,
    quotes,
    categories,
    settings,
    metrics: {
      monthlyRevenue,
      estimatedNetProfit,
      pendingOrdersCount,
      deliveredOrdersCount,
      totalOrdersCount: orders.length,
      newQuotesCount,
      totalQuotesCount: quotes.length,
      activeProductsCount: products.filter((p) => p.is_active).length,
    },
  });
}
