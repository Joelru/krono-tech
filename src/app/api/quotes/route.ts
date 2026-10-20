import { NextRequest, NextResponse } from 'next/server';
import { createCustomQuote, getStoreSettings } from '@/lib/db';
import { buildWhatsAppQuoteUrl } from '@/lib/format';
import { QuoteEquipmentType } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      equipment_type,
      primary_uses,
      budget_range,
      comments,
      customer_name,
      customer_phone,
      customer_city,
    } = body;

    const validType: QuoteEquipmentType =
      equipment_type === 'pc_gamer' ? 'pc_gamer' : 'portatil';

    if (!Array.isArray(primary_uses) || primary_uses.length === 0) {
      return NextResponse.json(
        { error: 'Por favor selecciona al menos un uso principal para tu equipo.' },
        { status: 400 }
      );
    }

    if (!budget_range || String(budget_range).trim().length === 0) {
      return NextResponse.json(
        { error: 'Selecciona un rango de presupuesto estimado.' },
        { status: 400 }
      );
    }

    if (!customer_name || String(customer_name).trim().length < 2) {
      return NextResponse.json(
        { error: 'Por favor ingresa tu nombre.' },
        { status: 400 }
      );
    }

    const cleanPhone = String(customer_phone || '').replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return NextResponse.json(
        {
          error:
            'El número de WhatsApp debe tener exactamente 10 dígitos numéricos (Ej: 3001234567).',
        },
        { status: 400 }
      );
    }

    if (!customer_city || String(customer_city).trim().length < 2) {
      return NextResponse.json(
        { error: 'Por favor ingresa tu ciudad (Ej: Ocaña).' },
        { status: 400 }
      );
    }

    const quote = createCustomQuote({
      equipment_type: validType,
      primary_uses: primary_uses.map((u: unknown) => String(u)),
      budget_range: String(budget_range).trim(),
      comments: comments ? String(comments).trim() : '',
      customer_name: String(customer_name).trim(),
      customer_phone: cleanPhone,
      customer_city: String(customer_city).trim(),
    });

    const settings = getStoreSettings();
    const whatsapp_url = buildWhatsAppQuoteUrl(quote, settings.whatsapp_number);

    return NextResponse.json({
      success: true,
      quote,
      whatsapp_url,
    });
  } catch (error) {
    console.error('Error creating custom quote:', error);
    return NextResponse.json(
      { error: 'No se pudo procesar la cotización. Intenta nuevamente.' },
      { status: 500 }
    );
  }
}
