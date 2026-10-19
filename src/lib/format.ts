import { Order } from '@/types';

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
 * Builds the official Krono Tech pre-structured WhatsApp message for checkout confirmation
 */
export function buildWhatsAppOrderUrl(order: Order, whatsappNumber: string): string {
  const cleanPhone = whatsappNumber.replace(/\D/g, '');
  const finalPhone = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;

  const productsLines = order.items
    .map((item) => `${item.title} (x${item.quantity})`)
    .join(', ');

  const formattedTotal = new Intl.NumberFormat('es-CO').format(Math.round(order.total_amount));
  const modality =
    order.payment_method === 'cod'
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
 * Builds clipboard text ready to paste in Dropi or send to local courier
 */
export function buildDropiClipboardText(order: Order): string {
  const itemsList = order.items
    .map((i) => `• ${i.title} x${i.quantity} [${i.inventory_type === 'dropi' ? 'DROPI' : 'LOCAL'}]`)
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
