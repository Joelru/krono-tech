import path from 'path';
import fs from 'fs';
import {
  Category,
  CustomQuote,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  PublicProduct,
  QuoteEquipmentType,
  QuoteStatus,
  StoreSettings,
} from '@/types';

interface DatabaseState {
  categories: Category[];
  products: Product[];
  orders: Order[];
  custom_quotes: CustomQuote[];
  settings: StoreSettings;
}

const localDataDir = path.join(process.cwd(), 'data');
const localJsonPath = path.join(localDataDir, 'krono-store.json');
const vercelTmpPath = path.join('/tmp', 'krono-store.json');

const globalForStore = globalThis as unknown as {
  kronoStoreState?: DatabaseState;
};

function getInitialDefaultState(): DatabaseState {
  const categories: Category[] = [
    {
      id: 'cat-teclados',
      name: 'Teclados Mecánicos',
      slug: 'teclados-mecanicos',
      icon: 'Keyboard',
      description: 'Teclados mecánicos, magnéticos y custom de alto rendimiento.',
    },
    {
      id: 'cat-mouses',
      name: 'Mouses',
      slug: 'mouses',
      icon: 'Mouse',
      description: 'Mouses competitivos ultraligeros e inalámbricos de precisión.',
    },
    {
      id: 'cat-audio',
      name: 'Audio & IEMs',
      slug: 'audio-iems',
      icon: 'Headphones',
      description: 'Monitores In-Ear y diademas gamer de alta fidelidad.',
    },
    {
      id: 'cat-streaming',
      name: 'Streaming & Micrófonos',
      slug: 'streaming-microfonos',
      icon: 'Mic',
      description: 'Micrófonos, brazos e interfaces para creadores y streamers.',
    },
    {
      id: 'cat-setup',
      name: 'Accesorios de Setup',
      slug: 'accesorios-setup',
      icon: 'Monitor',
      description: 'Mousepads, soportes de monitor, cables y accesorios pro.',
    },
  ];

  const settings: StoreSettings = {
    id: 1,
    whatsapp_number: '573000000000',
    top_bar_text:
      '🚚 Envíos Gratis a toda Colombia | Entrega Hoy en Ocaña (Ruta 5:00 PM) | Pago Contraentrega',
    payment_qr_info: {
      nequi_number: '',
      nequi_holder: 'Krono Tech',
      bancolombia_account: '',
      bancolombia_type: 'Ahorros Bancolombia',
      bancolombia_holder: 'Krono Tech',
      qr_image_url: '',
      transfer_discount_percent: 5,
      transfer_benefit_text: 'Descuento especial por pago anticipado + Despacho Prioritario',
    },
    hero_banner_config: {
      badge_text: 'KRONO TECH // HARDWARE & PERIFÉRICOS PRO',
      headline: 'PRECISIÓN ABSOLUTA.',
      highlight_text: 'CERO LATENCIA.',
      subheadline:
        'Periféricos gamer de alto rendimiento y portátiles/PCs bajo pedido en Ocaña y toda Colombia. Pago Contraentrega.',
      cta_primary_text: 'Pedir Ahora — Pago en Casa',
      featured_product_slug: '',
      hero_image_url: '',
      spec_highlight_1: 'Envío Nacional Asegurado',
      spec_highlight_2: 'Pago Contraentrega',
      spec_highlight_3: 'Garantía Oficial Krono Tech',
    },
    shipping_config: {
      free_shipping_threshold: 0,
      default_national_shipping: 0,
      default_local_shipping: 0,
      local_city_name: 'Ocaña',
    },
  };

  return {
    categories,
    products: [],
    orders: [],
    custom_quotes: [],
    settings,
  };
}

function normalizeState(rawState: Partial<DatabaseState>): DatabaseState {
  const defaults = getInitialDefaultState();
  return {
    categories: Array.isArray(rawState.categories) ? rawState.categories : defaults.categories,
    products: Array.isArray(rawState.products) ? rawState.products : [],
    orders: Array.isArray(rawState.orders) ? rawState.orders : [],
    custom_quotes: Array.isArray(rawState.custom_quotes) ? rawState.custom_quotes : [],
    settings: rawState.settings ? { ...defaults.settings, ...rawState.settings } : defaults.settings,
  };
}

function loadState(): DatabaseState {
  if (globalForStore.kronoStoreState) {
    if (!Array.isArray(globalForStore.kronoStoreState.custom_quotes)) {
      globalForStore.kronoStoreState.custom_quotes = [];
    }
    return globalForStore.kronoStoreState;
  }

  // 1. Check Vercel /tmp runtime file first if on Vercel
  if (process.env.VERCEL && fs.existsSync(vercelTmpPath)) {
    try {
      const raw = fs.readFileSync(vercelTmpPath, 'utf8');
      globalForStore.kronoStoreState = normalizeState(JSON.parse(raw));
      return globalForStore.kronoStoreState!;
    } catch {
      // fall through
    }
  }

  // 2. Check repository data/krono-store.json
  if (fs.existsSync(localJsonPath)) {
    try {
      const raw = fs.readFileSync(localJsonPath, 'utf8');
      globalForStore.kronoStoreState = normalizeState(JSON.parse(raw));
      return globalForStore.kronoStoreState!;
    } catch {
      // fall through
    }
  }

  // 3. Initialize clean production state
  const initial = getInitialDefaultState();
  globalForStore.kronoStoreState = initial;
  persistState(initial);
  return initial;
}

function persistState(state: DatabaseState) {
  globalForStore.kronoStoreState = state;
  const serialized = JSON.stringify(state, null, 2);

  try {
    if (!fs.existsSync(localDataDir)) {
      fs.mkdirSync(localDataDir, { recursive: true });
    }
    fs.writeFileSync(localJsonPath, serialized, 'utf8');
  } catch {
    // On Vercel serverless where process.cwd() is read-only, persist to /tmp
    try {
      fs.writeFileSync(vercelTmpPath, serialized, 'utf8');
    } catch (err) {
      console.error('Persist fallback error:', err);
    }
  }
}

// ============================================================================
// SECURITY SANITIZER
// ============================================================================

/**
 * SECURITY BOUNDARY: Strips private financial & Dropi fields before sending to public clients.
 */
export function sanitizeProductForPublic(product: Product): PublicProduct {
  const {
    supplier_cost: _sc,
    estimated_shipping_cost: _esc,
    dropi_reference_url: _dru,
    ...publicProduct
  } = product;
  return publicProduct;
}

function enrichCategoryInfo(product: Product, categories: Category[]): Product {
  const cat = categories.find((c) => c.id === product.category_id);
  return {
    ...product,
    category_name: cat ? cat.name : product.category_name || 'Hardware',
    category_slug: cat ? cat.slug : product.category_slug || 'hardware',
  };
}

// ============================================================================
// DATA ACCESS FUNCTIONS
// ============================================================================

export function getCategories(): Category[] {
  return loadState().categories;
}

export function getPublicProducts(): PublicProduct[] {
  const state = loadState();
  return state.products
    .filter((p) => p.is_active)
    .sort((a, b) => {
      if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .map((p) => enrichCategoryInfo(p, state.categories))
    .map(sanitizeProductForPublic);
}

export function getPublicProductBySlug(slug: string): PublicProduct | null {
  const state = loadState();
  const found = state.products.find((p) => p.slug === slug && p.is_active);
  if (!found) return null;
  return sanitizeProductForPublic(enrichCategoryInfo(found, state.categories));
}

export function getAdminProducts(): Product[] {
  const state = loadState();
  return state.products
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((p) => enrichCategoryInfo(p, state.categories));
}

export function getAdminProductById(id: string): Product | null {
  const state = loadState();
  const found = state.products.find((p) => p.id === id);
  return found ? enrichCategoryInfo(found, state.categories) : null;
}

export function createProduct(data: Omit<Product, 'id' | 'created_at'>): Product {
  const state = loadState();
  const id = `prod-${Date.now().toString(36)}`;
  const created_at = new Date().toISOString();

  let finalSlug = data.slug;
  if (state.products.some((p) => p.slug === finalSlug)) {
    finalSlug = `${data.slug}-${Math.floor(100 + Math.random() * 900)}`;
  }

  const newProduct: Product = {
    ...data,
    id,
    slug: finalSlug,
    sale_price: Number(data.sale_price),
    compare_price: data.compare_price ? Number(data.compare_price) : null,
    supplier_cost: Number(data.supplier_cost || 0),
    estimated_shipping_cost: Number(data.estimated_shipping_cost || 0),
    stock: Number(data.stock || 0),
    estimated_arrival_date:
      data.inventory_type === 'preorder'
        ? String(data.estimated_arrival_date || '').trim()
        : '',
    created_at,
  };

  state.products.unshift(newProduct);
  persistState(state);
  return enrichCategoryInfo(newProduct, state.categories);
}

export function updateProduct(id: string, data: Partial<Product>): Product | null {
  const state = loadState();
  const index = state.products.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const current = state.products[index];
  const nextInventoryType = data.inventory_type ?? current.inventory_type;
  const nextArrivalDate =
    nextInventoryType === 'preorder'
      ? data.estimated_arrival_date !== undefined
        ? String(data.estimated_arrival_date).trim()
        : current.estimated_arrival_date || ''
      : '';

  const updated: Product = {
    ...current,
    ...data,
    id: current.id,
    inventory_type: nextInventoryType,
    estimated_arrival_date: nextArrivalDate,
    sale_price:
      data.sale_price !== undefined ? Number(data.sale_price) : current.sale_price,
    compare_price:
      data.compare_price !== undefined
        ? data.compare_price !== null
          ? Number(data.compare_price)
          : null
        : current.compare_price,
    supplier_cost:
      data.supplier_cost !== undefined ? Number(data.supplier_cost) : current.supplier_cost,
    estimated_shipping_cost:
      data.estimated_shipping_cost !== undefined
        ? Number(data.estimated_shipping_cost)
        : current.estimated_shipping_cost,
    stock: data.stock !== undefined ? Number(data.stock) : current.stock,
  };

  state.products[index] = updated;
  persistState(state);
  return enrichCategoryInfo(updated, state.categories);
}

export function deleteProduct(id: string): boolean {
  const state = loadState();
  const initialLen = state.products.length;
  state.products = state.products.filter((p) => p.id !== id);
  if (state.products.length !== initialLen) {
    persistState(state);
    return true;
  }
  return false;
}

export function getStoreSettings(): StoreSettings {
  return loadState().settings;
}

export function updateStoreSettings(data: Partial<StoreSettings>): StoreSettings {
  const state = loadState();
  const current = state.settings;
  state.settings = {
    ...current,
    ...data,
    payment_qr_info: {
      ...current.payment_qr_info,
      ...(data.payment_qr_info || {}),
    },
    hero_banner_config: {
      ...current.hero_banner_config,
      ...(data.hero_banner_config || {}),
    },
    shipping_config: {
      ...current.shipping_config,
      ...(data.shipping_config || {}),
    },
  };
  persistState(state);
  return state.settings;
}

// ============================================================================
// ORDERS (INCLUYE CAPTURA DE LEADS / CARRITOS ABANDONADOS EN CHECKOUT)
// ============================================================================

export function getAdminOrders(): Order[] {
  const state = loadState();
  return state.orders
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function createCustomerOrder(input: {
  customer_name: string;
  customer_phone: string;
  department: string;
  city: string;
  address: string;
  neighborhood_reference: string;
  payment_method: 'cod' | 'transfer';
  cartItems: { product_id: string; quantity: number }[];
}): Order {
  const state = loadState();
  const settings = state.settings;

  const nextNumber = 1001 + state.orders.length;
  const order_number = `KT-${nextNumber}`;
  const id = `ord-${Date.now().toString(36)}`;
  const created_at = new Date().toISOString();

  let subtotal_amount = 0;
  let total_supplier_and_shipping_cost = 0;
  const orderItems: OrderItem[] = [];

  for (const item of input.cartItems) {
    const productIdx = state.products.findIndex((p) => p.id === item.product_id);
    if (productIdx === -1) continue;
    const product = state.products[productIdx];

    const qty = Math.max(1, Number(item.quantity || 1));
    const lineRevenue = product.sale_price * qty;
    const lineCost = (product.supplier_cost + product.estimated_shipping_cost) * qty;

    subtotal_amount += lineRevenue;
    total_supplier_and_shipping_cost += lineCost;

    orderItems.push({
      product_id: product.id,
      title: product.title,
      slug: product.slug,
      image: product.images[0] || '/brand/logo-icon.png',
      quantity: qty,
      unit_price: product.sale_price,
      inventory_type: product.inventory_type,
      estimated_arrival_date: product.estimated_arrival_date || '',
      frozen_supplier_cost: product.supplier_cost,
      frozen_shipping_cost: product.estimated_shipping_cost,
    });

    if (product.inventory_type !== 'preorder') {
      state.products[productIdx] = {
        ...product,
        stock: Math.max(0, product.stock - qty),
      };
    }
  }

  const discountPercent =
    input.payment_method === 'transfer'
      ? Number(settings.payment_qr_info.transfer_discount_percent || 0)
      : 0;
  const discount_amount = Math.round(subtotal_amount * (discountPercent / 100));
  const shipping_amount =
    subtotal_amount >= settings.shipping_config.free_shipping_threshold
      ? 0
      : settings.shipping_config.default_national_shipping;

  const total_amount = subtotal_amount - discount_amount + shipping_amount;
  const estimated_profit = total_amount - total_supplier_and_shipping_cost;

  const newOrder: Order = {
    id,
    order_number,
    customer_name: input.customer_name.trim(),
    customer_phone: input.customer_phone.replace(/\D/g, ''),
    department: input.department,
    city: input.city,
    address: input.address.trim(),
    neighborhood_reference: input.neighborhood_reference.trim(),
    payment_method: input.payment_method,
    items: orderItems,
    subtotal_amount,
    discount_amount,
    shipping_amount,
    total_amount,
    estimated_profit,
    status: 'pending', // Guardado inmediatamente con estado "Pendiente WhatsApp"
    tracking_number: '',
    carrier: '',
    created_at,
  };

  state.orders.unshift(newOrder);
  persistState(state);
  return newOrder;
}

export function updateAdminOrder(
  id: string,
  data: Partial<Pick<Order, 'status' | 'tracking_number' | 'carrier'>>
): Order | null {
  const state = loadState();
  const idx = state.orders.findIndex((o) => o.id === id);
  if (idx === -1) return null;

  const current = state.orders[idx];
  const updated: Order = {
    ...current,
    status: (data.status as OrderStatus) ?? current.status,
    tracking_number: data.tracking_number ?? current.tracking_number,
    carrier: data.carrier ?? current.carrier,
  };

  state.orders[idx] = updated;
  persistState(state);
  return updated;
}

export function deleteAdminOrder(id: string): boolean {
  const state = loadState();
  const initialLen = state.orders.length;
  state.orders = state.orders.filter((o) => o.id !== id);
  if (state.orders.length !== initialLen) {
    persistState(state);
    return true;
  }
  return false;
}

// ============================================================================
// CUSTOM PC & LAPTOP QUOTES (TABLA / COLECCIÓN `custom_quotes`)
// ============================================================================

export function getAdminQuotes(): CustomQuote[] {
  const state = loadState();
  return (state.custom_quotes || [])
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function createCustomQuote(input: {
  equipment_type: QuoteEquipmentType;
  primary_uses: string[];
  budget_range: string;
  comments: string;
  customer_name: string;
  customer_phone: string;
  customer_city: string;
}): CustomQuote {
  const state = loadState();
  if (!Array.isArray(state.custom_quotes)) {
    state.custom_quotes = [];
  }

  const nextNumber = 101 + state.custom_quotes.length;
  const quote_number = `COT-${nextNumber}`;
  const id = `quote-${Date.now().toString(36)}`;
  const created_at = new Date().toISOString();

  const equipment_label =
    input.equipment_type === 'portatil'
      ? '💻 Portátil Nuevo'
      : '🖥️ Armar PC de Escritorio / Gamer';

  const newQuote: CustomQuote = {
    id,
    quote_number,
    equipment_type: input.equipment_type,
    equipment_label,
    primary_uses: input.primary_uses,
    budget_range: input.budget_range,
    comments: (input.comments || '').trim(),
    customer_name: input.customer_name.trim(),
    customer_phone: input.customer_phone.replace(/\D/g, ''),
    customer_city: input.customer_city.trim(),
    status: 'nueva',
    created_at,
  };

  state.custom_quotes.unshift(newQuote);
  persistState(state);
  return newQuote;
}

export function updateAdminQuote(
  id: string,
  data: Partial<Pick<CustomQuote, 'status' | 'comments'>>
): CustomQuote | null {
  const state = loadState();
  if (!Array.isArray(state.custom_quotes)) {
    state.custom_quotes = [];
  }
  const idx = state.custom_quotes.findIndex((q) => q.id === id);
  if (idx === -1) return null;

  const current = state.custom_quotes[idx];
  const updated: CustomQuote = {
    ...current,
    status: (data.status as QuoteStatus) ?? current.status,
    comments: data.comments ?? current.comments,
  };

  state.custom_quotes[idx] = updated;
  persistState(state);
  return updated;
}

export function deleteAdminQuote(id: string): boolean {
  const state = loadState();
  if (!Array.isArray(state.custom_quotes)) return false;
  const initialLen = state.custom_quotes.length;
  state.custom_quotes = state.custom_quotes.filter((q) => q.id !== id);
  if (state.custom_quotes.length !== initialLen) {
    persistState(state);
    return true;
  }
  return false;
}

/**
 * Merges remote orders and custom_quotes (e.g. from Vercel runtime) into local database without duplicates
 */
export function mergeRemoteLeads(remoteOrders: Order[], remoteQuotes: CustomQuote[]): boolean {
  const state = loadState();
  let changed = false;

  if (Array.isArray(remoteOrders)) {
    for (const ro of remoteOrders) {
      if (ro?.id && !state.orders.some((o) => o.id === ro.id)) {
        state.orders.unshift(ro);
        changed = true;
      }
    }
  }

  if (!Array.isArray(state.custom_quotes)) {
    state.custom_quotes = [];
  }
  if (Array.isArray(remoteQuotes)) {
    for (const rq of remoteQuotes) {
      if (rq?.id && !state.custom_quotes.some((q) => q.id === rq.id)) {
        state.custom_quotes.unshift(rq);
        changed = true;
      }
    }
  }

  if (changed) {
    persistState(state);
  }
  return changed;
}
