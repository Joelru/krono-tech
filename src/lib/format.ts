import { CustomQuote, Order } from '@/types';

/**
 * Formats a number in Colombian Pesos: "$ 249.900 COP"
 */
export function formatCOP(amount: number, includeSuffix = true): string {
  const rounded = Math.round(amount || 0);
  const formatted = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rounded);
  return includeSuffix ? `$ ${formatted} COP` : `$ ${formatted}`;
}

/**
 * Calculates discount percentage between compare_price and sale_price
 */
export function calculateDiscountPercent(
  salePrice: number,
  comparePrice: number | null | undefined
): number {
  if (!comparePrice || comparePrice <= salePrice || salePrice <= 0) return 0;
  return Math.round(((comparePrice - salePrice) / comparePrice) * 100);
}

/**
 * Generates URL-friendly slug from product title
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Validates strict Colombian mobile phone: 10 numeric digits starting with '3'
 */
export function isValidColombianPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return /^3\d{9}$/.test(digits);
}

/**
 * Checks if a city string refers to Ocaña (accent & case insensitive)
 */
export function isOcanaCity(city: string | null | undefined): boolean {
  if (!city) return false;
  const normalized = city
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
  return normalized === 'ocana' || normalized.includes('ocana');
}

/**
 * Normalizes WhatsApp phone number to Colombia international format (57...)
 */
export function normalizeWhatsAppNumber(whatsappNumber: string): string {
  const cleanPhone = (whatsappNumber || '573000000000').replace(/\D/g, '');
  return cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;
}

/**
 * Builds the official Krono Tech pre-structured WhatsApp message for checkout confirmation
 * Supports standard orders, local Ocaña orders, and Preorder / Incoming Batch reservations.
 */
export function buildWhatsAppOrderUrl(order: Order, whatsappNumber: string): string {
  const finalPhone = normalizeWhatsAppNumber(whatsappNumber);

  const hasPreorder = order.items.some((item) => item.inventory_type === 'preorder');
  const isLocalOcana = isOcanaCity(order.city);

  const productsLines = order.items
    .map((item) => {
      if (item.inventory_type === 'preorder') {
        const arrivalNote = item.estimated_arrival_date
          ? ` — ${item.estimated_arrival_date}`
          : '';
        return `${item.title} (x${item.quantity}) [⏳ RESERVA LOTE EN CAMINO${arrivalNote}]`;
      }
      return `${item.title} (x${item.quantity})`;
    })
    .join(', ');

  const formattedTotal = new Intl.NumberFormat('es-CO').format(Math.round(order.total_amount));

  if (hasPreorder) {
    const message = [
      `¡Hola Krono Tech! ⏳ Quiero RESERVAR una unidad del próximo lote en camino (Pedido #${order.order_number} con $0 de anticipo):`,
      `- Producto a reservar: ${productsLines}`,
      `- Valor a pagar cuando llegue: $${formattedTotal} COP`,
      `- Modalidad: Reserva Anticipada en Lista Prioritaria (Pago al recibir)`,
      `- Cliente: ${order.customer_name} (${order.customer_phone})`,
      `- Ciudad: ${order.city}, ${order.department}`,
      `- Dirección: ${order.address} (${order.neighborhood_reference})`,
      `Por favor agéndame en la lista prioritaria del lote en camino.`,
    ].join('\n');

    return `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
  }

  const modality = isLocalOcana
    ? order.payment_method === 'cod'
      ? 'Entrega Local Ocaña Ruta 5:15 PM - 7:30 PM (Pago en Efectivo al recibir)'
      : 'Entrega Local Ocaña Ruta 5:15 PM - 7:30 PM (Pago por Nequi / Transferencia)'
    : order.payment_method === 'cod'
    ? 'Contraentrega (Pago en Casa)'
    : 'Transferencia Nequi / Bancolombia';

  const message = [
    `¡Hola Krono Tech! 👋 Acabo de realizar el pedido #${order.order_number} en la web:`,
    `- Producto: ${productsLines}`,
    `- Total: $${formattedTotal} COP`,
    `- Modalidad: ${modality}`,
    `- Ciudad: ${order.city}, ${order.department}`,
    `- Dirección: ${order.address} (${order.neighborhood_reference})`,
    `Confirmo mis datos para el despacho.`,
  ].join('\n');

  return `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Builds the official Krono Tech WhatsApp message for Custom PC / Laptop Quotes
 */
export function buildWhatsAppQuoteUrl(
  quote: Pick<
    CustomQuote,
    | 'equipment_type'
    | 'primary_uses'
    | 'budget_range'
    | 'comments'
    | 'customer_name'
    | 'customer_city'
  >,
  whatsappNumber: string
): string {
  const finalPhone = normalizeWhatsAppNumber(whatsappNumber);

  const equipmentName =
    quote.equipment_type === 'portatil' ? 'Portátil' : 'PC Gamer';
  const usesText = quote.primary_uses.join(', ');
  const extraDetails = quote.comments?.trim()
    ? quote.comments.trim()
    : 'Sin detalles específicos (abierto a recomendaciones)';

  const message = [
    `¡Hola Krono Tech! 🖥️ Quiero cotizar un ${equipmentName} bajo pedido:`,
    `- Uso principal: ${usesText}`,
    `- Presupuesto aprox: ${quote.budget_range}`,
    `- Detalles extra: ${extraDetails}`,
    `- Mi nombre es ${quote.customer_name} (${quote.customer_city}). ¿Qué opciones calidad/precio me recomiendas?`,
  ].join('\n');

  return `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Builds the WhatsApp URL for Local Optimization & Upgrade Services in Ocaña
 */
export function buildWhatsAppServiceUrl(
  serviceName: string | null,
  whatsappNumber: string
): string {
  const finalPhone = normalizeWhatsAppNumber(whatsappNumber);

  const serviceLine = serviceName
    ? `Estoy interesado en el servicio de *${serviceName}* para mi equipo en Ocaña.`
    : `Quiero agendar una revisión / cotizar un upgrade de rendimiento (SSD / RAM / Mantenimiento Térmico) para mi equipo en Ocaña.`;

  const message = [
    `¡Hola Krono Tech! 🛠️⚡`,
    serviceLine,
    `¿Me puedes dar información y disponibilidad de atención después de las 5:00 PM?`,
  ].join('\n');

  return `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Builds clipboard text ready to paste in Dropi or send to local courier
 */
export function buildDropiClipboardText(order: Order): string {
  const itemsList = order.items
    .map((i) => {
      const tag =
        i.inventory_type === 'preorder'
          ? `RESERVA LOTE EN CAMINO${i.estimated_arrival_date ? ` (${i.estimated_arrival_date})` : ''}`
          : i.inventory_type === 'dropi'
          ? 'DROPI NACIONAL'
          : 'STOCK LOCAL OCAÑA';
      return `• ${i.title} x${i.quantity} [${tag}]`;
    })
    .join('\n');

  const recaudoText =
    order.payment_method === 'cod'
      ? `${formatCOP(order.total_amount)} (CON RECAUDO - CONTRAENTREGA)`
      : `$ 0 COP (SIN RECAUDO - YA PAGADO POR TRANSFERENCIA: ${formatCOP(order.total_amount)})`;

  return [
    `=== DESPACHO KRONO TECH #${order.order_number} ===`,
    `Nombre: ${order.customer_name}`,
    `Teléfono / WhatsApp: ${order.customer_phone}`,
    `Departamento: ${order.department}`,
    `Ciudad / Municipio: ${order.city}`,
    `Dirección Exacta: ${order.address}`,
    `Barrio / Referencia: ${order.neighborhood_reference}`,
    `Valor a Recaudar: ${recaudoText}`,
    `Productos:`,
    itemsList,
  ].join('\n');
}
