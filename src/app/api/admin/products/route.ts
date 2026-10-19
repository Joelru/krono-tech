import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/auth';
import { createProduct, getAdminProducts } from '@/lib/db';
import { slugify } from '@/lib/format';

export async function GET() {
  if (!(await isAuthenticatedAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  return NextResponse.json({ products: getAdminProducts() });
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticatedAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body.title || !body.sale_price || !body.category_id) {
      return NextResponse.json(
        { error: 'Título, Precio de Venta y Categoría son obligatorios.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.images) || body.images.length === 0) {
      return NextResponse.json(
        { error: 'Por favor sube o agrega al menos 1 foto del producto.' },
        { status: 400 }
      );
    }

    const product = createProduct({
      title: String(body.title).trim(),
      slug: body.slug ? slugify(String(body.slug)) : slugify(String(body.title)),
      description: String(body.description || ''),
      specs: Array.isArray(body.specs) ? body.specs : [],
      images: body.images,
      video_url: body.video_url ? String(body.video_url) : '',
      audio_Switch_type: body.audio_Switch_type ? String(body.audio_Switch_type) : '',
      sale_price: Number(body.sale_price),
      compare_price: body.compare_price ? Number(body.compare_price) : null,
      supplier_cost: Number(body.supplier_cost || 0),
      estimated_shipping_cost: Number(body.estimated_shipping_cost || 0),
      inventory_type: body.inventory_type === 'local' ? 'local' : 'dropi',
      dropi_reference_url: body.dropi_reference_url ? String(body.dropi_reference_url) : '',
      stock: Number(body.stock ?? 10),
      category_id: String(body.category_id),
      badges: Array.isArray(body.badges) ? body.badges : [],
      is_featured: Boolean(body.is_featured),
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
    });

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Error al crear el producto.' }, { status: 500 });
  }
}
