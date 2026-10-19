import { NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/auth';
import {
  getAdminOrders,
  getAdminProducts,
  getCategories,
  getStoreSettings,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const isAdmin = await isAuthenticatedAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'No autorizado. Inicia sesión como Administrador.' },
      { status: 401 }
    );
  }

  const products = getAdminProducts();
  const orders = getAdminOrders();
  const categories = getCategories();
  const settings = getStoreSettings();

  // Calculate Dashboard Metrics (excluding cancelled orders)
  const validOrders = orders.filter((o) => o.status !== 'cancelled');
  const monthlyRevenue = validOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const estimatedNetProfit = validOrders.reduce((sum, o) => sum + o.estimated_profit, 0);
  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;
  const deliveredOrdersCount = orders.filter((o) => o.status === 'delivered').length;

  return NextResponse.json({
    products,
    orders,
    categories,
    settings,
    metrics: {
      monthlyRevenue,
      estimatedNetProfit,
      pendingOrdersCount,
      deliveredOrdersCount,
      totalOrdersCount: orders.length,
      activeProductsCount: products.filter((p) => p.is_active).length,
    },
  });
}
