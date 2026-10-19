import { NextRequest, NextResponse } from 'next/server';
import { createCustomerOrder, getStoreSettings } from '@/lib/db';
import { buildWhatsAppOrderUrl, isValidColombianPhone } from '@/lib/format';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customer_name,
      customer_phone,
      department,
      city,
      address,
      neighborhood_reference,
      payment_method,
      cartItems,
    } = body;

    if (!customer_name || String(customer_name).trim().length < 3) {
      return NextResponse.json(
        { error: 'Por favor ingresa tu nombre y apellidos completos.' },
        { status: 400 }
      );
    }

    if (!customer_phone || !isValidColombianPhone(String(customer_phone))) {
      return NextResponse.json(
        {
          error:
            'El número de Celular / WhatsApp debe tener exactamente 10 dígitos numéricos y empezar por 3 (Ej: 3001234567).',
        },
        { status: 400 }
      );
    }

    if (!department || !city) {
      return NextResponse.json(
        { error: 'Selecciona tu Departamento y Municipio/Ciudad de entrega.' },
        { status: 400 }
      );
    }

    if (!address || String(address).trim().length < 5) {
      return NextResponse.json(
        { error: 'Ingresa la dirección exacta de entrega (Calle/Carrera, Número, Apto/Casa).' },
        { status: 400 }
      );
    }

    if (!neighborhood_reference || String(neighborhood_reference).trim().length < 4) {
      return NextResponse.json(
        {
          error:
            'El Barrio y Punto de Referencia son obligatorios para garantizar la entrega sin devoluciones de transportadora.',
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json(
        { error: 'El pedido no contiene productos válidos.' },
        { status: 400 }
      );
    }

    const order = createCustomerOrder({
      customer_name: String(customer_name),
      customer_phone: String(customer_phone),
      department: String(department),
      city: String(city),
      address: String(address),
      neighborhood_reference: String(neighborhood_reference),
      payment_method: payment_method === 'transfer' ? 'transfer' : 'cod',
      cartItems,
    });

    const settings = getStoreSettings();
    const whatsapp_url = buildWhatsAppOrderUrl(order, settings.whatsapp_number);

    // Strip private financial fields before returning to public client
    const { estimated_profit: _ep, ...publicOrder } = order;
    const sanitizedItems = publicOrder.items.map(
      ({ frozen_supplier_cost: _fsc, frozen_shipping_cost: _fshc, ...pubItem }) => pubItem
    );

    return NextResponse.json({
      success: true,
      order: {
        ...publicOrder,
        items: sanitizedItems,
      },
      whatsapp_url,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'No se pudo procesar el pedido. Intenta nuevamente.' },
      { status: 500 }
    );
  }
}
