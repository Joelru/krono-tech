export type InventoryType = 'dropi' | 'local';
export type PaymentMethod = 'cod' | 'transfer';
export type OrderStatus = 'pending' | 'shipped' | 'delivered' | 'cancelled';

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description?: string;
}

/**
 * Full Product model (ONLY accessible on server & authenticated /admin endpoints)
 * Contains sensitive financial fields: supplier_cost, estimated_shipping_cost, dropi_reference_url
 */
export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  specs: ProductSpec[];
  images: string[];
  video_url?: string;
  audio_Switch_type?: string; // Optional sound test preset ('linear' | 'tactile' | 'clicky')
  sale_price: number;
  compare_price: number | null;
  supplier_cost: number; // PRIVATE - Admin only
  estimated_shipping_cost: number; // PRIVATE - Admin only
  inventory_type: InventoryType;
  dropi_reference_url?: string; // PRIVATE - Admin only
  stock: number;
  category_id: string;
  category_name?: string;
  category_slug?: string;
  badges: string[];
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
}

/**
 * Sanitized Public Product model exposed to customers.
 * Private financial fields are strictly stripped at the API boundary.
 */
export type PublicProduct = Omit<
  Product,
  'supplier_cost' | 'estimated_shipping_cost' | 'dropi_reference_url'
>;

export interface OrderItem {
  product_id: string;
  title: string;
  slug: string;
  image: string;
  quantity: number;
  unit_price: number;
  inventory_type: InventoryType;
  // Private frozen costs recorded at purchase time (stored in DB, visible in Admin)
  frozen_supplier_cost?: number;
  frozen_shipping_cost?: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  department: string;
  city: string;
  address: string;
  neighborhood_reference: string;
  payment_method: PaymentMethod;
  items: OrderItem[];
  subtotal_amount: number;
  discount_amount: number;
  shipping_amount: number;
  total_amount: number;
  estimated_profit: number; // PRIVATE - Admin only
  status: OrderStatus;
  tracking_number: string;
  carrier: string;
  created_at: string;
}

export interface PaymentQrInfo {
  nequi_number: string;
  nequi_holder: string;
  bancolombia_account: string;
  bancolombia_type: string;
  bancolombia_holder: string;
  qr_image_url: string;
  transfer_discount_percent: number;
  transfer_benefit_text: string;
}

export interface HeroBannerConfig {
  badge_text: string;
  headline: string;
  highlight_text: string;
  subheadline: string;
  cta_primary_text: string;
  featured_product_slug: string;
  hero_image_url: string;
  spec_highlight_1: string;
  spec_highlight_2: string;
  spec_highlight_3: string;
}

export interface ShippingConfig {
  free_shipping_threshold: number;
  default_national_shipping: number;
  default_local_shipping: number;
  local_city_name: string;
}

export interface StoreSettings {
  id: number;
  whatsapp_number: string;
  top_bar_text: string;
  payment_qr_info: PaymentQrInfo;
  hero_banner_config: HeroBannerConfig;
  shipping_config: ShippingConfig;
}

export interface CartItem {
  product: PublicProduct;
  quantity: number;
}
