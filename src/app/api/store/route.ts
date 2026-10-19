import { NextResponse } from 'next/server';
import { getCategories, getPublicProducts, getStoreSettings } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categories = getCategories();
    const products = getPublicProducts(); // Strictly sanitized (no supplier_cost, estimated_shipping_cost, or dropi_reference_url)
    const settings = getStoreSettings();

    return NextResponse.json({
      categories,
      products,
      settings,
    });
  } catch (error) {
    console.error('Error fetching public store data:', error);
    return NextResponse.json(
      { error: 'Error cargando catálogo de Krono Tech' },
      { status: 500 }
    );
  }
}
