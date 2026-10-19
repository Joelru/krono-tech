import { NextRequest, NextResponse } from 'next/server';
import { getPublicProductBySlug, getStoreSettings } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const product = getPublicProductBySlug(slug);
  if (!product) {
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
  }
  const settings = getStoreSettings();
  return NextResponse.json({ product, settings });
}
