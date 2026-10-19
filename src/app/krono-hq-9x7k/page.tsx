'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Package,
  ShoppingCart,
  Settings,
  LogOut,
  Plus,
  Search,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  Upload,
  ArrowUp,
  ArrowDown,
  DollarSign,
  TrendingUp,
  Clock,
  ShieldAlert,
  Save,
  X,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import {
  Category,
  InventoryType,
  Order,
  OrderStatus,
  Product,
  ProductSpec,
  StoreSettings,
} from '@/types';
import { buildDropiClipboardText, formatCOP, slugify } from '@/lib/format';

type AdminTab = 'products' | 'orders' | 'settings';

const STATUS_LABELS: Record<OrderStatus, { label: string; badgeClass: string }> = {
  pending: {
    label: 'Pendiente por Confirmar (WhatsApp)',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-400/35',
  },
  shipped: {
    label: 'Enviado / En Tránsito (Guía generada)',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-400/35',
  },
  delivered: {
    label: 'Entregado (Dinero recaudado)',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/35',
  },
  cancelled: {
    label: 'Cancelado / Devolución',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-400/35',
  },
};

const PRESET_BADGES = [
  'Más Vendido',
  'Nuevo',
  'Oferta',
  'Top eSports',
  'Sound Test Activo',
  'Edición Limitada',
];

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Dashboard Data (Defaults to 'products' tab if catalog is empty so owner can upload right away)
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Orders Filter State
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  // Products Filter & Modal State
  const [productSearch, setProductSearch] = useState('');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Product Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('cat-teclados');
  const [formDescription, setFormDescription] = useState('');
  const [formSalePrice, setFormSalePrice] = useState<number>(0);
  const [formComparePrice, setFormComparePrice] = useState<string>('');
  const [formSupplierCost, setFormSupplierCost] = useState<number>(0);
  const [formShippingCost, setFormShippingCost] = useState<number>(0);
  const [formInventoryType, setFormInventoryType] = useState<InventoryType>('dropi');
  const [formDropiUrl, setFormDropiUrl] = useState('');
  const [formStock, setFormStock] = useState<number>(10);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formBadges, setFormBadges] = useState<string[]>([]);
  const [formImages, setFormImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [formVideoUrl, setFormVideoUrl] = useState('');
  const [formAudioSwitch, setFormAudioSwitch] = useState('');
  const [formSpecs, setFormSpecs] = useState<ProductSpec[]>([
    { label: '', value: '' },
    { label: '', value: '' },
  ]);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  const fetchDashboard = async () => {
    setLoadingData(true);
    try {
      const res = await fetch('/api/admin/dashboard', { cache: 'no-store' });
      if (res.status === 401) {
        setAuthenticated(false);
        return;
      }
      const data = await res.json();
      setAuthenticated(true);
      setProducts(data.products || []);
      setOrders(data.orders || []);
      setCategories(data.categories || []);
      setSettings(data.settings || null);
    } catch (e) {
      console.error('Error loading admin dashboard:', e);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'Credenciales incorrectas.');
        setLoggingIn(false);
        return;
      }
      setAuthenticated(true);
      setLoggingIn(false);
      fetchDashboard();
    } catch {
      setLoginError('Error de red al iniciar sesión.');
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    setAuthenticated(false);
  };

  // Live Calculated Dashboard KPIs
  const kpis = useMemo(() => {
    const validOrders = orders.filter((o) => o.status !== 'cancelled');
    const monthlyRevenue = validOrders.reduce((acc, o) => acc + o.total_amount, 0);
    const estimatedNetProfit = validOrders.reduce((acc, o) => acc + o.estimated_profit, 0);
    const pendingCount = orders.filter((o) => o.status === 'pending').length;
    return {
      monthlyRevenue,
      estimatedNetProfit,
      pendingCount,
      activeProducts: products.filter((p) => p.is_active).length,
    };
  }, [orders, products]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) return false;
      if (orderSearch.trim() !== '') {
        const q = orderSearch.toLowerCase();
        return (
          o.order_number.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          o.customer_phone.includes(q) ||
          o.city.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [orders, orderStatusFilter, orderSearch]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!productSearch.trim()) return true;
      const q = productSearch.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.category_name || '').toLowerCase().includes(q)
      );
    });
  }, [products, productSearch]);

  // Order Actions
  const handleCopyDropi = async (order: Order) => {
    const text = buildDropiClipboardText(order);
    await navigator.clipboard.writeText(text);
    setCopiedOrderId(order.id);
    notify(`Datos de #${order.order_number} copiados listos para Dropi`);
    setTimeout(() => setCopiedOrderId(null), 2200);
  };

  const handleUpdateOrderField = async (
    orderId: string,
    patch: Partial<Pick<Order, 'status' | 'tracking_number' | 'carrier'>>
  ) => {
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const data = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
      notify('Pedido actualizado');
    }
  };

  const handleDeleteOrder = async (order: Order) => {
    if (!window.confirm(`¿Eliminar el pedido #${order.order_number}?`)) return;
    const res = await fetch(`/api/admin/orders/${order.id}`, { method: 'DELETE' });
    if (res.ok) {
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      notify(`Pedido #${order.order_number} eliminado`);
    }
  };

  // Product Modal Openers
  const openCreateProductModal = () => {
    setEditingProduct(null);
    setFormTitle('');
    setFormSlug('');
    setFormCategoryId(categories[0]?.id || 'cat-teclados');
    setFormDescription('');
    setFormSalePrice(0);
    setFormComparePrice('');
    setFormSupplierCost(0);
    setFormShippingCost(0);
    setFormInventoryType('dropi');
    setFormDropiUrl('');
    setFormStock(10);
    setFormIsActive(true);
    setFormIsFeatured(products.length === 0);
    setFormBadges([]);
    setFormImages([]);
    setFormVideoUrl('');
    setFormAudioSwitch('');
    setFormSpecs([
      { label: '', value: '' },
      { label: '', value: '' },
    ]);
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormTitle(prod.title);
    setFormSlug(prod.slug);
    setFormCategoryId(prod.category_id);
    setFormDescription(prod.description);
    setFormSalePrice(prod.sale_price);
    setFormComparePrice(prod.compare_price ? String(prod.compare_price) : '');
    setFormSupplierCost(prod.supplier_cost);
    setFormShippingCost(prod.estimated_shipping_cost);
    setFormInventoryType(prod.inventory_type);
    setFormDropiUrl(prod.dropi_reference_url || '');
    setFormStock(prod.stock);
    setFormIsActive(prod.is_active);
    setFormIsFeatured(prod.is_featured);
    setFormBadges(prod.badges || []);
    setFormImages(prod.images || []);
    setFormVideoUrl(prod.video_url || '');
    setFormAudioSwitch(prod.audio_Switch_type || '');
    setFormSpecs(
      prod.specs && prod.specs.length > 0 ? prod.specs : [{ label: '', value: '' }]
    );
    setIsProductModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setUploadingImages(true);
    try {
      const formData = new FormData();
      Array.from(fileList).forEach((f) => formData.append('files', f));

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.urls) {
        setFormImages((prev) => [...prev, ...data.urls]);
        notify(`${data.urls.length} foto(s) comprimida(s) y cargada(s)`);
      } else {
        notify(data.error || 'Error subiendo imagen');
      }
    } catch {
      notify('Error al subir archivo');
    } finally {
      setUploadingImages(false);
      e.target.value = '';
    }
  };

  const moveImage = (idx: number, direction: -1 | 1) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= formImages.length) return;
    const copy = [...formImages];
    const temp = copy[idx];
    copy[idx] = copy[targetIdx];
    copy[targetIdx] = temp;
    setFormImages(copy);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formImages.length === 0) {
      notify('Por favor sube al menos 1 foto del producto antes de guardar.');
      return;
    }

    if (Number(formSalePrice) <= 0) {
      notify('Ingresa un Precio de Venta Público válido en COP.');
      return;
    }

    const cleanedSpecs = formSpecs.filter((s) => s.label.trim() && s.value.trim());

    const payload = {
      title: formTitle.trim(),
      slug: formSlug.trim() || slugify(formTitle),
      category_id: formCategoryId,
      description: formDescription.trim(),
      sale_price: Number(formSalePrice),
      compare_price: formComparePrice ? Number(formComparePrice) : null,
      supplier_cost: Number(formSupplierCost || 0),
      estimated_shipping_cost: Number(formShippingCost || 0),
      inventory_type: formInventoryType,
      dropi_reference_url: formDropiUrl.trim(),
      stock: Number(formStock),
      is_active: formIsActive,
      is_featured: formIsFeatured,
      badges: formBadges,
      images: formImages,
      video_url: formVideoUrl.trim(),
      audio_Switch_type: formAudioSwitch,
      specs: cleanedSpecs,
    };

    const url = editingProduct
      ? `/api/admin/products/${editingProduct.id}`
      : '/api/admin/products';
    const method = editingProduct ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setIsProductModalOpen(false);
      notify(editingProduct ? 'Producto actualizado' : 'Producto publicado en tienda');
      fetchDashboard();
    } else {
      const err = await res.json();
      notify(err.error || 'Error guardando producto');
    }
  };

  const handleToggleProductActive = async (prod: Product) => {
    const res = await fetch(`/api/admin/products/${prod.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !prod.is_active }),
    });
    if (res.ok) {
      const data = await res.json();
      setProducts((prev) => prev.map((p) => (p.id === prod.id ? data.product : p)));
      notify(data.product.is_active ? 'Producto visible en tienda' : 'Producto oculto/pausado');
    }
  };

  const handleDeleteProduct = async (prod: Product) => {
    if (!window.confirm(`¿Eliminar permanentemente "${prod.title}"?`)) return;
    const res = await fetch(`/api/admin/products/${prod.id}`, { method: 'DELETE' });
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== prod.id));
      notify('Producto eliminado');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (res.ok) {
      const data = await res.json();
      setSettings(data.settings);
      notify('Configuración guardada');
    }
  };

  // Real-time Profit Calculation inside Product Editor
  const unitNetProfit =
    Number(formSalePrice || 0) - Number(formSupplierCost || 0) - Number(formShippingCost || 0);
  const unitMarginPercent =
    formSalePrice > 0 ? Math.round((unitNetProfit / formSalePrice) * 100) : 0;

  // ============================================================================
  // RENDER: PRODUCTION ADMIN LOGIN SCREEN
  // ============================================================================
  if (authenticated === false) {
    return (
      <div className="min-h-screen bg-[#090D16] flex items-center justify-center p-4 text-slate-100">
        <div className="w-full max-w-md rounded-3xl bg-[#111827] border border-white/10 p-6 sm:p-9 shadow-[0_25px_90px_rgba(0,0,0,0.85)] space-y-6">
          <div className="text-center space-y-2">
            <BrandLogo variant="stacked" size="md" className="mx-auto" />
            <p className="text-xs font-mono uppercase tracking-widest text-sky-400 pt-2">
              PANEL DE ADMINISTRACIÓN PRIVADO
            </p>
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                Correo de Administrador
              </label>
              <input
                type="email"
                required
                autoComplete="username"
                placeholder="admin@kronotech.co"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#090D16] border border-white/10 focus:border-sky-400 focus:outline-none text-base sm:text-sm text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#090D16] border border-white/10 focus:border-sky-400 focus:outline-none text-base sm:text-sm text-white font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3.5 rounded-xl bg-white active:bg-sky-400 hover:bg-sky-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
            >
              {loggingIn ? 'Verificando...' : 'Ingresar al Backoffice'}
            </button>
          </form>

          <div className="text-center pt-1">
            <Link
              href="/"
              className="text-xs font-mono text-slate-400 hover:text-sky-400 transition"
            >
              ← Volver a la tienda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (authenticated === null || loadingData) {
    return (
      <div className="min-h-screen bg-[#090D16] flex items-center justify-center text-slate-300 font-mono text-sm">
        Cargando Backoffice de Krono Tech...
      </div>
    );
  }

  // ============================================================================
  // RENDER: AUTHENTICATED ADMIN BACKOFFICE (MOBILE & DESKTOP)
  // ============================================================================
  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col">
      {/* Top Admin Navbar */}
      <header className="sticky top-0 z-30 bg-[#0B0F19]/95 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BrandLogo variant="horizontal" size="sm" />
          <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-sky-400/15 text-sky-300 border border-sky-400/30">
            CMS & RENTABILIDAD PRIVADA
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#111827] hover:bg-[#1E293B] text-xs font-mono text-slate-200 border border-white/10 transition"
          >
            <span className="hidden xs:inline">Ver Tienda</span>
            <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/25 text-xs font-mono transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto px-3.5 sm:px-8 py-5 sm:py-7 space-y-6 flex-1">
        {/* 4.2. TARJETAS DE RESUMEN FINANCIERO Y MÉTRICAS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-[#111827] border border-white/[0.08] space-y-1.5">
            <div className="flex items-center justify-between text-[10px] sm:text-xs font-mono text-slate-400">
              <span>VENTAS TOTALES</span>
              <DollarSign className="w-4 h-4 text-sky-400 shrink-0" />
            </div>
            <p className="text-lg sm:text-2xl font-mono font-bold text-white truncate">
              {formatCOP(kpis.monthlyRevenue)}
            </p>
            <span className="text-[10px] sm:text-[11px] text-slate-400 block">
              Facturación acumulada
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#111827] to-emerald-950/30 border border-emerald-500/30 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] sm:text-xs font-mono text-emerald-300">
              <span>GANANCIA NETA</span>
              <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>
            <p className="text-lg sm:text-2xl font-mono font-bold text-emerald-400 truncate">
              {formatCOP(kpis.estimatedNetProfit)}
            </p>
            <span className="text-[10px] sm:text-[11px] text-emerald-300/80 block">
              Libre (Resta Dropi + Flete)
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#111827] border border-amber-500/30 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] sm:text-xs font-mono text-amber-300">
              <span>POR CONFIRMAR</span>
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            </div>
            <p className="text-lg sm:text-2xl font-mono font-bold text-white">
              {kpis.pendingCount}
            </p>
            <span className="text-[10px] sm:text-[11px] text-amber-300/80 block">
              Pendientes WhatsApp
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#111827] border border-white/[0.08] space-y-1.5">
            <div className="flex items-center justify-between text-[10px] sm:text-xs font-mono text-slate-400">
              <span>CATÁLOGO ACTIVO</span>
              <Package className="w-4 h-4 text-sky-400 shrink-0" />
            </div>
            <p className="text-lg sm:text-2xl font-mono font-bold text-white">
              {kpis.activeProducts} / {products.length}
            </p>
            <span className="text-[10px] sm:text-[11px] text-slate-400 block">
              Productos publicados
            </span>
          </div>
        </div>

        {/* NAVIGATION TABS (Scrollable on Mobile) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider shrink-0 transition cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-sky-400 text-slate-950 font-bold shadow-[0_0_20px_rgba(56,189,248,0.35)]'
                  : 'bg-[#111827] text-slate-300 hover:text-white border border-white/10'
              }`}
            >
              <Package className="w-4 h-4" />
              Productos ({products.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider shrink-0 transition cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-sky-400 text-slate-950 font-bold shadow-[0_0_20px_rgba(56,189,248,0.35)]'
                  : 'bg-[#111827] text-slate-300 hover:text-white border border-white/10'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              Pedidos ({orders.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider shrink-0 transition cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-sky-400 text-slate-950 font-bold shadow-[0_0_20px_rgba(56,189,248,0.35)]'
                  : 'bg-[#111827] text-slate-300 hover:text-white border border-white/10'
              }`}
            >
              <Settings className="w-4 h-4" />
              Ajustes Tienda
            </button>
          </div>

          {activeTab === 'products' && (
            <button
              type="button"
              onClick={openCreateProductModal}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 rounded-xl bg-white active:bg-sky-400 hover:bg-sky-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              <Plus className="w-4 h-4" />
              Subir Nuevo Producto
            </button>
          )}
        </div>

        {/* =====================================================================
            TAB 1: GESTIÓN DE PRODUCTOS (CRUD COMPLETO + RENTABILIDAD DROPI/LOCAL)
           ===================================================================== */}
        {activeTab === 'products' && (
          <div className="space-y-5">
            {products.length > 0 && (
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Buscar producto en tu inventario..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#111827] border border-white/10 focus:border-sky-400 focus:outline-none text-xs font-mono text-white"
                  />
                </div>
              </div>
            )}

            {products.length === 0 ? (
              <div className="rounded-3xl bg-[#111827] border border-white/[0.08] p-8 sm:p-14 text-center max-w-xl mx-auto space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-sky-400/10 border border-sky-400/25 flex items-center justify-center mx-auto text-sky-400">
                  <Package className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  Sube tu primer producto a Krono Tech
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Agrega tus productos de Dropi o de Stock Físico Local con sus fotos reales,
                  especificaciones técnicas, precio público y costos privados para calcular tu
                  ganancia neta automáticamente.
                </p>
                <button
                  type="button"
                  onClick={openCreateProductModal}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-sky-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Crear Primer Producto
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProducts.map((prod) => {
                  const netProfit =
                    prod.sale_price - prod.supplier_cost - prod.estimated_shipping_cost;
                  const marginPct =
                    prod.sale_price > 0 ? Math.round((netProfit / prod.sale_price) * 100) : 0;

                  return (
                    <div
                      key={prod.id}
                      className={`rounded-2xl bg-[#111827] border p-4 flex flex-col justify-between gap-4 transition ${
                        prod.is_active
                          ? 'border-white/[0.08] hover:border-sky-400/30'
                          : 'border-rose-500/20 opacity-65'
                      }`}
                    >
                      <div className="flex gap-3.5 sm:gap-4">
                        <img
                          src={prod.images[0] || '/brand/logo-icon.png'}
                          alt={prod.title}
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover shrink-0 border border-white/10 bg-[#090D16]"
                        />
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                                prod.inventory_type === 'local'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                              }`}
                            >
                              {prod.inventory_type === 'local'
                                ? '⚡ Stock Local'
                                : '🚚 Dropi Nacional'}
                            </span>
                            <span className="text-xs font-mono text-slate-400">
                              Stock: <strong className="text-white">{prod.stock}</strong>
                            </span>
                          </div>

                          <h3 className="text-sm font-bold text-white truncate">{prod.title}</h3>

                          <div className="flex items-baseline gap-2">
                            <span className="text-sm sm:text-base font-mono font-bold text-sky-400">
                              Venta: {formatCOP(prod.sale_price)}
                            </span>
                            {prod.compare_price && (
                              <span className="text-xs font-mono text-slate-500 line-through">
                                {formatCOP(prod.compare_price, false)}
                              </span>
                            )}
                          </div>

                          {/* Private Financial Breakdown */}
                          <div className="p-2 rounded-xl bg-[#090D16] border border-white/[0.06] grid grid-cols-3 gap-1.5 text-[10px] sm:text-[11px] font-mono">
                            <div>
                              <span className="text-slate-500 block">Costo Prov.</span>
                              <span className="text-slate-200">
                                {formatCOP(prod.supplier_cost, false)}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Flete Est.</span>
                              <span className="text-slate-200">
                                {formatCOP(prod.estimated_shipping_cost, false)}
                              </span>
                            </div>
                            <div>
                              <span className="text-emerald-400 block">Ganancia</span>
                              <span className="text-emerald-400 font-bold">
                                {formatCOP(netProfit, false)} ({marginPct}%)
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.06]">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleProductActive(prod)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition cursor-pointer ${
                              prod.is_active
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border-white/10'
                            }`}
                          >
                            {prod.is_active ? (
                              <>
                                <Eye className="w-3.5 h-3.5" /> Activo
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5" /> Pausado
                              </>
                            )}
                          </button>

                          {prod.dropi_reference_url && (
                            <a
                              href={
                                prod.dropi_reference_url.startsWith('http')
                                  ? prod.dropi_reference_url
                                  : `https://app.dropi.co`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono bg-white/5 hover:bg-white/10 text-sky-300"
                              title={prod.dropi_reference_url}
                            >
                              <span>Dropi</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditProductModal(prod)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-400/15 hover:bg-sky-400/25 text-sky-300 border border-sky-400/30 text-xs font-mono transition cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(prod)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition cursor-pointer"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            TAB 2: GESTIÓN DE PEDIDOS + BOTÓN "COPIAR DATOS PARA DROPI"
           ===================================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-5">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Buscar por #KT-1001, cliente, celular o ciudad..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#111827] border border-white/10 focus:border-sky-400 focus:outline-none text-xs font-mono text-white"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'pending', label: 'Pendientes (WhatsApp)' },
                  { id: 'shipped', label: 'Enviados / En Tránsito' },
                  { id: 'delivered', label: 'Entregados' },
                  { id: 'cancelled', label: 'Cancelados' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setOrderStatusFilter(st.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-mono border shrink-0 transition cursor-pointer ${
                      orderStatusFilter === st.id
                        ? 'bg-sky-400/20 text-sky-300 border-sky-400'
                        : 'bg-[#111827] text-slate-400 border-white/10 hover:text-white'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="rounded-3xl bg-[#111827] border border-white/[0.08] p-10 text-center space-y-2">
                <ShoppingCart className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <h3 className="text-base font-bold text-white">No hay pedidos registrados</h3>
                <p className="text-xs text-slate-400">
                  Cada vez que un cliente confirme su compra desde el Checkout de 1 paso, aparecerá
                  aquí en tiempo real con el botón para copiar los datos a Dropi.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
                  return (
                    <div
                      key={order.id}
                      className="rounded-2xl bg-[#111827] border border-white/[0.08] p-4 sm:p-5 space-y-4 hover:border-white/15 transition"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] pb-3.5">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <span className="px-3 py-1 rounded-lg bg-sky-400/15 text-sky-300 font-mono font-bold text-xs sm:text-sm border border-sky-400/30">
                            #{order.order_number}
                          </span>
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-mono border ${statusInfo.badgeClass}`}
                          >
                            {statusInfo.label}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {new Date(order.created_at).toLocaleString('es-CO')}
                          </span>
                        </div>

                        {/* BOTÓN RÁPIDO: COPIAR DATOS PARA DROPI */}
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => handleCopyDropi(order)}
                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-sky-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs font-mono transition cursor-pointer shadow-[0_0_20px_rgba(56,189,248,0.3)]"
                          >
                            {copiedOrderId === order.id ? (
                              <>
                                <Check className="w-4 h-4" />
                                ¡Copiado para Dropi!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                Copiar Datos para Dropi
                              </>
                            )}
                          </button>

                          <a
                            href={`https://wa.me/57${order.customer_phone.replace(
                              /\D/g,
                              ''
                            )}?text=${encodeURIComponent(
                              `¡Hola ${order.customer_name}! 👋 Te escribimos de Krono Tech sobre tu pedido #${
                                order.order_number
                              }.${
                                order.tracking_number
                                  ? ` Tu guía de rastreo por ${
                                      order.carrier || 'transportadora'
                                    } es: ${order.tracking_number}`
                                  : ' Confirmamos tus datos para despachar hoy mismo.'
                              }`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-mono transition"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            WhatsApp
                          </a>

                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(order)}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
                            title="Eliminar pedido"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Customer Details + Order Items + Financial Profit */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
                        <div className="lg:col-span-5 space-y-1 text-xs">
                          <p className="text-slate-400 font-mono uppercase">Datos del Cliente:</p>
                          <p className="text-sm font-bold text-white">{order.customer_name}</p>
                          <p className="font-mono text-sky-300">Cel: {order.customer_phone}</p>
                          <p className="text-slate-200">
                            <strong>Ciudad:</strong> {order.city}, {order.department}
                          </p>
                          <p className="text-slate-200">
                            <strong>Dirección:</strong> {order.address}
                          </p>
                          <p className="text-amber-300/90">
                            <strong>Barrio / Ref:</strong> {order.neighborhood_reference}
                          </p>
                        </div>

                        <div className="lg:col-span-4 space-y-2 text-xs">
                          <p className="text-slate-400 font-mono uppercase">Productos & Recaudo:</p>
                          <div className="space-y-1.5">
                            {order.items.map((item, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between bg-[#090D16] px-3 py-2 rounded-lg border border-white/[0.06]"
                              >
                                <span className="truncate pr-2 text-slate-200">
                                  {item.title} <strong>x{item.quantity}</strong>
                                </span>
                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-sky-300 shrink-0 uppercase">
                                  {item.inventory_type}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                            <div>
                              <span className="block text-[11px] text-slate-400">
                                Pago:{' '}
                                <strong className="text-white">
                                  {order.payment_method === 'cod'
                                    ? 'CONTRAENTREGA'
                                    : 'TRANSFERENCIA'}
                                </strong>
                              </span>
                              <span className="text-base font-mono font-bold text-white">
                                Total: {formatCOP(order.total_amount)}
                              </span>
                            </div>

                            <div className="text-right">
                              <span className="block text-[10px] font-mono uppercase text-emerald-400">
                                Utilidad Neta
                              </span>
                              <span className="text-sm font-mono font-bold text-emerald-400">
                                + {formatCOP(order.estimated_profit)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status Selector & Tracking Guide Input */}
                        <div className="lg:col-span-3 space-y-2.5 bg-[#090D16] p-3.5 rounded-xl border border-white/[0.06]">
                          <div>
                            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                              Estado del Pedido
                            </label>
                            <select
                              value={order.status}
                              onChange={(e) =>
                                handleUpdateOrderField(order.id, {
                                  status: e.target.value as OrderStatus,
                                })
                              }
                              className="w-full px-2.5 py-2 rounded-lg bg-[#111827] border border-white/10 text-xs text-white focus:border-sky-400 focus:outline-none"
                            >
                              <option value="pending">Pendiente por Confirmar (WhatsApp)</option>
                              <option value="shipped">Enviado / En Tránsito (Guía generada)</option>
                              <option value="delivered">Entregado (Dinero recaudado)</option>
                              <option value="cancelled">Cancelado / Devolución</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                                Transportadora
                              </label>
                              <input
                                type="text"
                                placeholder="Interrapidísimo / Envía"
                                defaultValue={order.carrier}
                                onBlur={(e) => {
                                  if (e.target.value !== order.carrier) {
                                    handleUpdateOrderField(order.id, { carrier: e.target.value });
                                  }
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#111827] border border-white/10 text-xs text-white font-mono"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                                Número de Guía
                              </label>
                              <input
                                type="text"
                                placeholder="Ej: 240019283"
                                defaultValue={order.tracking_number}
                                onBlur={(e) => {
                                  if (e.target.value !== order.tracking_number) {
                                    handleUpdateOrderField(order.id, {
                                      tracking_number: e.target.value,
                                    });
                                  }
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#111827] border border-white/10 text-xs text-sky-300 font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            TAB 3: CONFIGURACIÓN GENERAL DE LA TIENDA
           ===================================================================== */}
        {activeTab === 'settings' && settings && (
          <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 rounded-2xl bg-[#111827] border border-white/[0.08] p-5 sm:p-6 space-y-4">
              <h3 className="text-sm font-mono uppercase tracking-wider text-sky-400">
                1. WhatsApp Receptor & Barra de Anuncios
              </h3>

              <div>
                <label className="block text-xs text-slate-300 mb-1.5">
                  Tu Número de WhatsApp Oficial para Recibir Pedidos (Ej: 573001234567)
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={settings.whatsapp_number}
                  onChange={(e) =>
                    setSettings({ ...settings, whatsapp_number: e.target.value })
                  }
                  placeholder="573001234567"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090D16] border border-white/10 text-sm font-mono text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1.5">
                  Texto del Banner Superior (Top Bar)
                </label>
                <input
                  type="text"
                  value={settings.top_bar_text}
                  onChange={(e) => setSettings({ ...settings, top_bar_text: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090D16] border border-white/10 text-sm text-white"
                />
              </div>

              <h3 className="text-sm font-mono uppercase tracking-wider text-sky-400 pt-3">
                2. Datos de Nequi / Bancolombia (Transferencia)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Número Nequi</label>
                  <input
                    type="text"
                    placeholder="300 000 0000"
                    value={settings.payment_qr_info.nequi_number}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        payment_qr_info: {
                          ...settings.payment_qr_info,
                          nequi_number: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#090D16] border border-white/10 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Cuenta Bancolombia
                  </label>
                  <input
                    type="text"
                    placeholder="000-000000-00"
                    value={settings.payment_qr_info.bancolombia_account}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        payment_qr_info: {
                          ...settings.payment_qr_info,
                          bancolombia_account: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#090D16] border border-white/10 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">Titular de la Cuenta</label>
                  <input
                    type="text"
                    value={settings.payment_qr_info.nequi_holder}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        payment_qr_info: {
                          ...settings.payment_qr_info,
                          nequi_holder: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#090D16] border border-white/10 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    % Descuento por Transferencia
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={settings.payment_qr_info.transfer_discount_percent}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        payment_qr_info: {
                          ...settings.payment_qr_info,
                          transfer_discount_percent: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#090D16] border border-white/10 text-xs font-mono text-emerald-400"
                  />
                </div>
              </div>
            </div>

            {/* Hero Banner Config */}
            <div className="lg:col-span-6 rounded-2xl bg-[#111827] border border-white/[0.08] p-5 sm:p-6 space-y-4">
              <h3 className="text-sm font-mono uppercase tracking-wider text-sky-400">
                3. Producto Estrella & Textos del Hero Banner
              </h3>

              <div>
                <label className="block text-xs text-slate-300 mb-1.5">
                  Producto Estrella Destacado en el Inicio
                </label>
                <select
                  value={settings.hero_banner_config.featured_product_slug}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      hero_banner_config: {
                        ...settings.hero_banner_config,
                        featured_product_slug: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090D16] border border-white/10 text-sm text-white"
                >
                  <option value="">Automático (Primer producto destacado)</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.slug}>
                      {p.title} ({formatCOP(p.sale_price)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Título Principal</label>
                  <input
                    type="text"
                    value={settings.hero_banner_config.headline}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        hero_banner_config: {
                          ...settings.hero_banner_config,
                          headline: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#090D16] border border-white/10 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Texto Resaltado Cian
                  </label>
                  <input
                    type="text"
                    value={settings.hero_banner_config.highlight_text}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        hero_banner_config: {
                          ...settings.hero_banner_config,
                          highlight_text: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#090D16] border border-white/10 text-xs text-sky-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Subtítulo del Hero
                </label>
                <textarea
                  rows={2}
                  value={settings.hero_banner_config.subheadline}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      hero_banner_config: {
                        ...settings.hero_banner_config,
                        subheadline: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#090D16] border border-white/10 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-white hover:bg-sky-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Guardar Configuración
              </button>
            </div>
          </form>
        )}
      </main>

      {/* =======================================================================
          MODAL DE CREACIÓN / EDICIÓN DE PRODUCTO (CRUD COMPLETO MOBILE & PC)
         ======================================================================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-4xl h-[94dvh] sm:h-auto sm:max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#0B0F19] border-t sm:border border-white/15 shadow-2xl p-4 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3.5 sticky top-0 bg-[#0B0F19] z-20">
              <div>
                <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-sky-400">
                  GESTOR DE INVENTARIO & RENTABILIDAD DROPI / LOCAL
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  {editingProduct ? `Editar: ${editingProduct.title}` : 'Subir Nuevo Producto'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="p-2 rounded-full bg-white/10 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-6">
              {/* Row 1: Title, Slug, Category */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-5">
                  <label className="block text-xs text-slate-300 mb-1">
                    Título del Producto *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => {
                      setFormTitle(e.target.value);
                      if (!editingProduct) setFormSlug(slugify(e.target.value));
                    }}
                    placeholder="Ej: Teclado Mecánico Aula F75"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-base sm:text-sm text-white"
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="block text-xs text-slate-300 mb-1">
                    Slug (URL automática)
                  </label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(slugify(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-xs font-mono text-sky-300"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs text-slate-300 mb-1">Categoría *</label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-base sm:text-sm text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Precios y Calculadora de Rentabilidad Interna (Privado) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#111827] border border-emerald-500/25 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                    🔒 Precios y Rentabilidad Interna (Privado — Solo Admin)
                  </span>
                  <div className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-xs font-mono text-emerald-300">
                    Ganancia Neta por Venta:{' '}
                    <strong className="text-white">{formatCOP(unitNetProfit)}</strong> (
                    {unitMarginPercent}%)
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      Precio Venta Público *
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      required
                      min={1000}
                      placeholder="Ej: 249900"
                      value={formSalePrice || ''}
                      onChange={(e) => setFormSalePrice(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-[#090D16] border border-white/10 font-mono text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      Precio Antes / Tachado
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={formComparePrice}
                      onChange={(e) => setFormComparePrice(e.target.value)}
                      placeholder="Opcional"
                      className="w-full px-3 py-2 rounded-xl bg-[#090D16] border border-white/10 font-mono text-sm text-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-amber-300 mb-1">
                      Costo Proveedor (Dropi)
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="Ej: 110000"
                      value={formSupplierCost || ''}
                      onChange={(e) => setFormSupplierCost(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-[#090D16] border border-amber-500/30 font-mono text-sm text-amber-200"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-amber-300 mb-1">
                      Costo Flete Estimado
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="Ej: 18500"
                      value={formShippingCost || ''}
                      onChange={(e) => setFormShippingCost(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-[#090D16] border border-amber-500/30 font-mono text-sm text-amber-200"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Origen de Inventario, Stock, Dropi Link & Switches */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                <div className="sm:col-span-4">
                  <label className="block text-xs text-slate-300 mb-1">
                    Origen / Tipo de Inventario
                  </label>
                  <select
                    value={formInventoryType}
                    onChange={(e) => setFormInventoryType(e.target.value as InventoryType)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-xs font-mono text-white"
                  >
                    <option value="dropi">🚚 Dropshipping Nacional (Dropi)</option>
                    <option value="local">⚡ Stock Físico Local (Entrega Hoy)</option>
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-xs text-slate-300 mb-1">
                    ID o Link Privado en Dropi
                  </label>
                  <input
                    type="text"
                    value={formDropiUrl}
                    onChange={(e) => setFormDropiUrl(e.target.value)}
                    placeholder="ID o URL del producto en Dropi"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-xs font-mono text-slate-300"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs text-slate-300 mb-1">Stock Disp.</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-xs font-mono text-white"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-4 pb-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="accent-sky-400"
                    />
                    <span>Activo</span>
                  </label>

                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={formIsFeatured}
                      onChange={(e) => setFormIsFeatured(e.target.checked)}
                      className="accent-sky-400"
                    />
                    <span>Estrella</span>
                  </label>
                </div>
              </div>

              {/* Row 4: Gestor de Imágenes (Subida desde PC/Móvil + Reordenamiento de Portada) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#111827] border border-white/[0.08] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-mono uppercase tracking-wider text-sky-400">
                      Fotos del Producto * (Subida Directa desde Celular o PC)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Foto #1: Portada principal. Foto #2: Efecto Hover automático.
                    </p>
                  </div>

                  <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs font-mono cursor-pointer transition">
                    <Upload className="w-4 h-4" />
                    <span>{uploadingImages ? 'Subiendo...' : 'Subir Fotos'}</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Add Image by URL */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="O pega el link de una imagen (https://...)"
                    className="flex-1 px-3 py-2 rounded-xl bg-[#090D16] border border-white/10 text-xs font-mono text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newImageUrl.trim()) {
                        setFormImages((prev) => [...prev, newImageUrl.trim()]);
                        setNewImageUrl('');
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-mono text-white shrink-0"
                  >
                    Agregar
                  </button>
                </div>

                {/* Image Previews & Reordering */}
                {formImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    {formImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative rounded-xl overflow-hidden bg-[#090D16] border border-white/10 p-2 space-y-2"
                      >
                        <div className="aspect-square sm:aspect-[4/3] rounded-lg overflow-hidden relative">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-sky-300">
                            {idx === 0 ? '★ PORTADA' : idx === 1 ? '⚡ HOVER' : `#${idx + 1}`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveImage(idx, -1)}
                              disabled={idx === 0}
                              className="p-1.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30"
                            >
                              <ArrowUp className="w-3.5 h-3.5 -rotate-90" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveImage(idx, 1)}
                              disabled={idx === formImages.length - 1}
                              className="p-1.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30"
                            >
                              <ArrowDown className="w-3.5 h-3.5 -rotate-90" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setFormImages((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="p-1.5 rounded text-rose-400 hover:bg-rose-500/15"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Row 5: Etiquetas / Badges & Sound Test */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-6">
                  <label className="block text-xs text-slate-300 mb-1.5">
                    Etiquetas / Badges
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_BADGES.map((badge) => {
                      const active = formBadges.includes(badge);
                      return (
                        <button
                          key={badge}
                          type="button"
                          onClick={() =>
                            setFormBadges((prev) =>
                              active ? prev.filter((b) => b !== badge) : [...prev, badge]
                            )
                          }
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition ${
                            active
                              ? 'bg-sky-400 text-slate-950 font-bold border-sky-300'
                              : 'bg-[#111827] text-slate-400 border-white/10'
                          }`}
                        >
                          {badge}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs text-slate-300 mb-1">
                    Sound Test (Opcional)
                  </label>
                  <select
                    value={formAudioSwitch}
                    onChange={(e) => setFormAudioSwitch(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-white/10 text-xs font-mono text-white"
                  >
                    <option value="">Desactivado</option>
                    <option value="linear">Switch Linear (Thocky)</option>
                    <option value="tactile">Switch Magnético</option>
                    <option value="clicky">Micro-Switch Mouse</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs text-slate-300 mb-1">
                    URL Video (MP4 Opcional)
                  </label>
                  <input
                    type="text"
                    value={formVideoUrl}
                    onChange={(e) => setFormVideoUrl(e.target.value)}
                    placeholder="https://...mp4"
                    className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-white/10 text-xs font-mono text-white"
                  />
                </div>
              </div>

              {/* Row 6: Descripción y Editor Dinámico de Especificaciones Técnicas */}
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Descripción del Producto *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe los beneficios y características principales..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-base sm:text-sm text-white"
                />
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-[#111827] border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-mono uppercase tracking-wider text-sky-400">
                      Especificaciones Técnicas (Ficha Técnica)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Las 2 primeras especificaciones aparecen en la tarjeta del producto.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormSpecs((prev) => [...prev, { label: '', value: '' }])
                    }
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-400/15 text-sky-300 border border-sky-400/30 text-xs font-mono"
                  >
                    <Plus className="w-3.5 h-3.5" /> Fila
                  </button>
                </div>

                <div className="space-y-2">
                  {formSpecs.map((spec, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Ej: Sensor"
                        value={spec.label}
                        onChange={(e) => {
                          const next = [...formSpecs];
                          next[idx] = { ...next[idx], label: e.target.value };
                          setFormSpecs(next);
                        }}
                        className="w-2/5 sm:w-1/3 px-3 py-2 rounded-xl bg-[#090D16] border border-white/10 text-xs font-mono text-slate-200"
                      />
                      <input
                        type="text"
                        placeholder="Ej: PAW3395"
                        value={spec.value}
                        onChange={(e) => {
                          const next = [...formSpecs];
                          next[idx] = { ...next[idx], value: e.target.value };
                          setFormSpecs(next);
                        }}
                        className="flex-1 px-3 py-2 rounded-xl bg-[#090D16] border border-white/10 text-xs font-mono text-white"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setFormSpecs((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="p-2 text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 pb-4">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-white hover:bg-sky-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  {editingProduct ? 'Guardar Cambios' : 'Publicar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN TOAST */}
      {toast && (
        <div className="fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 z-50 px-4 py-3 rounded-xl bg-[#111827] border border-sky-400/40 text-white text-xs font-mono shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
