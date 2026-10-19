'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  ShoppingBag,
  Zap,
  Truck,
  ShieldCheck,
  Banknote,
  Keyboard,
  Mouse,
  Headphones,
  Mic,
  Monitor,
  SlidersHorizontal,
  ArrowRight,
  Sparkles,
  Volume2,
  X,
  CheckCircle2,
  MessageCircle,
  Package,
} from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { ProductCard } from '@/components/ProductCard';
import { ProductDetailModal } from '@/components/ProductDetailModal';
import { CheckoutModal } from '@/components/CheckoutModal';
import { CartItem, Category, PublicProduct, StoreSettings } from '@/types';
import { calculateDiscountPercent, formatCOP } from '@/lib/format';
import { playSwitchSound } from '@/lib/sound-test';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Keyboard: <Keyboard className="w-4 h-4" />,
  Mouse: <Mouse className="w-4 h-4" />,
  Headphones: <Headphones className="w-4 h-4" />,
  Mic: <Mic className="w-4 h-4" />,
  Monitor: <Monitor className="w-4 h-4" />,
};

export default function HomePage() {
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyLocalStock, setOnlyLocalStock] = useState(false);

  // Cart & Modals
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeProduct, setActiveProduct] = useState<PublicProduct | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadStore() {
      try {
        const res = await fetch('/api/store', { cache: 'no-store' });
        const data = await res.json();
        if (data.products) setProducts(data.products);
        if (data.categories) setCategories(data.categories);
        if (data.settings) setSettings(data.settings);
      } catch (err) {
        console.error('Error loading store:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStore();

    try {
      const saved = localStorage.getItem('krono_cart_v1');
      if (saved) setCart(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('krono_cart_v1', JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2200);
  };

  // Star Product for Hero Section
  const heroProduct = useMemo(() => {
    if (!products.length) return null;
    const targetSlug = settings?.hero_banner_config?.featured_product_slug;
    if (targetSlug) {
      const found = products.find((p) => p.slug === targetSlug);
      if (found) return found;
    }
    return products.find((p) => p.is_featured) || products[0];
  }, [products, settings]);

  // Real-time filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== 'all' && p.category_id !== selectedCategory) {
        return false;
      }
      if (onlyLocalStock && p.inventory_type !== 'local') {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchCategory = (p.category_name || '').toLowerCase().includes(q);
        const matchSpecs = (p.specs || []).some(
          (s) => s.label.toLowerCase().includes(q) || s.value.toLowerCase().includes(q)
        );
        const matchBadges = (p.badges || []).some((b) => b.toLowerCase().includes(q));
        return matchTitle || matchCategory || matchSpecs || matchBadges;
      }
      return true;
    });
  }, [products, selectedCategory, onlyLocalStock, searchQuery]);

  // Cart Handlers
  const handleAddToCart = (product: PublicProduct, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { product, quantity }];
    });
    showToast(`Agregado: ${product.title}`);
  };

  const handleBuyNow = (product: PublicProduct, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: Math.max(i.quantity, quantity) } : i
        );
      }
      return [...prev, { product, quantity }];
    });
    setActiveProduct(null);
    setIsCheckoutOpen(true);
  };

  const handleUpdateCartQty = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const totalCartItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const totalCartAmount = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.sale_price * item.quantity, 0),
    [cart]
  );

  const heroDiscount = heroProduct
    ? calculateDiscountPercent(heroProduct.sale_price, heroProduct.compare_price)
    : 0;

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col selection:bg-sky-400 selection:text-slate-950 pb-20 sm:pb-0">
      {/* 3.1. BLOQUE SUPERIOR FIJO UNIFICADO (TOP BAR + HEADER SIN ESPACIOS TRANSPARENTES AL SCROLLEAR) */}
      <div className="sticky top-0 z-40 w-full bg-[#090D16] shadow-[0_10px_30px_rgba(0,0,0,0.75)]">
        {/* TOP BAR FIJO CONFIGURABLE DESDE EL ADMIN */}
        <div className="w-full bg-[#0B1325] border-b border-sky-400/20 px-3 py-2 text-center">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-[11px] sm:text-xs font-mono tracking-wide text-sky-200">
            <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse shrink-0 shadow-[0_0_8px_#38BDF8]" />
            <p className="truncate sm:whitespace-normal font-medium">
              {settings?.top_bar_text ||
                '🚚 Envíos Gratis a toda Colombia | Pagas en efectivo al recibir en tu casa'}
            </p>
          </div>
        </div>

        {/* HEADER PRINCIPAL (Mobile-First, Logo Separado, Buscador y Carrito) */}
        <header className="w-full bg-[#090D16] border-b border-white/[0.08]">
          <div className="max-w-7xl mx-auto px-3.5 sm:px-6 h-15 sm:h-20 flex items-center justify-between gap-2.5 sm:gap-6">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-left focus:outline-none cursor-pointer shrink-0 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <BrandLogo variant="horizontal" size="md" />
            </button>

            {/* Real-Time Search Bar (Desktop) */}
            <div className="hidden md:flex flex-1 max-w-md relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar producto o especificación..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#111827] border border-white/[0.08] focus:border-sky-400 focus:outline-none text-xs font-mono text-white placeholder:text-slate-500 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setOnlyLocalStock((prev) => !prev)}
                className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono border transition-all duration-150 active:scale-[0.97] cursor-pointer ${
                  onlyLocalStock
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                    : 'bg-[#111827] text-slate-300 border-white/[0.08] hover:border-white/20'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                Entrega Hoy
              </button>

              <button
                type="button"
                onClick={() => setIsCheckoutOpen(true)}
                className="relative inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white hover:bg-sky-400 active:bg-sky-400 active:scale-[0.97] text-slate-950 font-bold text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Pedido</span>
                <span className="px-1.5 py-0.5 rounded-md bg-slate-950 text-sky-400 font-mono text-[11px]">
                  {totalCartItems}
                </span>
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="md:hidden px-3.5 pb-2.5 bg-[#090D16]">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar periférico o especificación..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#111827] border border-white/[0.08] focus:border-sky-400 focus:outline-none text-xs font-mono text-white placeholder:text-slate-500 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </header>
      </div>

      {/* 3.2. HERO SECTION (Micro-interacciones ligeras por GPU) */}
      {!searchQuery && selectedCategory === 'all' && (
        <section className="relative border-b border-white/[0.07] bg-[#0B0F19] overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-7 sm:py-12 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-10 items-center">
              {/* Hero Left Copy */}
              <div className="lg:col-span-7 space-y-4 sm:space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-400/10 border border-sky-400/25">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                  <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-sky-300 font-semibold">
                    {settings?.hero_banner_config?.badge_text ||
                      'KRONO TECH // HARDWARE & PERIFÉRICOS PRO'}
                  </span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.06] text-white">
                  {settings?.hero_banner_config?.headline || 'PRECISIÓN ABSOLUTA.'}{' '}
                  <span className="text-sky-400">
                    {settings?.hero_banner_config?.highlight_text || 'CERO LATENCIA.'}
                  </span>
                </h1>

                <p className="text-xs sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                  {settings?.hero_banner_config?.subheadline ||
                    'Periféricos gamer de alto rendimiento, audio y accesorios de setup en Colombia. Pago Contraentrega en la puerta de tu casa.'}
                </p>

                {/* Star Product Box if at least 1 product exists */}
                {heroProduct && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#111827] border border-white/10 hover:border-sky-400/35 transition-colors max-w-xl space-y-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400 block">
                          PRODUCTO ESTRELLA DESTACADO
                        </span>
                        <h2 className="text-base sm:text-lg font-bold text-white truncate">
                          {heroProduct.title}
                        </h2>
                      </div>
                      {heroDiscount > 0 && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-sky-400 text-slate-950 shrink-0">
                          -{heroDiscount}% OFF
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/[0.07]">
                      <div>
                        {heroProduct.compare_price && (
                          <span className="text-xs font-mono text-slate-500 line-through block">
                            {formatCOP(heroProduct.compare_price, false)}
                          </span>
                        )}
                        <span className="text-xl sm:text-2xl font-mono font-bold text-white">
                          {formatCOP(heroProduct.sale_price)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => handleBuyNow(heroProduct, 1)}
                          className="group/btn flex-1 sm:flex-initial py-3.5 px-5 rounded-xl bg-white hover:bg-sky-400 active:bg-sky-400 active:scale-[0.98] text-slate-950 font-bold text-xs uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <span>
                            {settings?.hero_banner_config?.cta_primary_text ||
                              'Pedir Ahora — Pago en Casa'}
                          </span>
                          <ArrowRight className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover/btn:translate-x-1" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveProduct(heroProduct)}
                          className="py-3.5 px-4 rounded-xl bg-[#1E293B] hover:bg-[#283548] active:scale-[0.97] text-slate-200 font-mono text-xs border border-white/10 transition-all duration-150 cursor-pointer shrink-0"
                        >
                          Ver
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Hero Right Visual */}
              <div className="lg:col-span-5">
                {heroProduct ? (
                  <div
                    onClick={() => setActiveProduct(heroProduct)}
                    className="group relative rounded-2xl overflow-hidden bg-[#111827] border border-white/15 hover:border-sky-400/45 transition-all duration-300 hover:shadow-[0_16px_40px_-12px_rgba(56,189,248,0.22)] cursor-pointer"
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden relative">
                      <img
                        src={
                          settings?.hero_banner_config?.hero_image_url ||
                          heroProduct.images?.[0] ||
                          '/brand/logo-full.png'
                        }
                        alt={heroProduct.title}
                        className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105 will-change-transform"
                      />

                      <div className="absolute top-3.5 left-3.5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#090D16]/90 text-emerald-300 border border-emerald-400/35">
                          <Zap className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                          {heroProduct.inventory_type === 'local'
                            ? '⚡ Entrega Hoy (Local)'
                            : '🚚 Envío Gratis Contraentrega'}
                        </span>
                      </div>

                      {heroProduct.audio_Switch_type && (
                        <div className="absolute bottom-3.5 left-3.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const type =
                                heroProduct.audio_Switch_type === 'tactile'
                                  ? 'tactile'
                                  : heroProduct.audio_Switch_type === 'clicky'
                                  ? 'clicky'
                                  : 'linear';
                              playSwitchSound(type, 0);
                            }}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#090D16]/90 text-sky-300 border border-sky-400/40 text-xs font-mono"
                          >
                            <Volume2 className="w-4 h-4" />
                            SOUND TEST
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-[#111827] border border-white/[0.08] p-10 flex flex-col items-center justify-center text-center min-h-[240px]">
                    <BrandLogo variant="stacked" size="lg" />
                    <p className="text-xs font-mono uppercase tracking-widest text-slate-400 mt-5">
                      HIGH PERFORMANCE GAMING GEAR // COLOMBIA
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3.2. NAVEGACIÓN DE CATEGORÍAS Y CATÁLOGO */}
      <section className="max-w-7xl mx-auto w-full px-3.5 sm:px-6 pt-6 sm:pt-8 pb-16 flex-1">
        {/* Horizontal Scrollable Category Pills */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 md:pb-0 no-scrollbar -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider shrink-0 border transition-colors cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-sky-400 text-slate-950 font-bold border-sky-300'
                  : 'bg-[#111827] text-slate-300 border-white/[0.08] hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Todos {products.length > 0 ? `(${products.length})` : ''}
            </button>

            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider shrink-0 border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-sky-400 text-slate-950 font-bold border-sky-300'
                      : 'bg-[#111827] text-slate-300 border-white/[0.08] hover:text-white'
                  }`}
                >
                  {CATEGORY_ICONS[cat.icon] || <Zap className="w-3.5 h-3.5" />}
                  {cat.name}
                </button>
              );
            })}
          </div>

          {products.length > 0 && (
            <div className="flex items-center justify-between md:justify-end gap-3">
              <button
                type="button"
                onClick={() => setOnlyLocalStock((prev) => !prev)}
                className={`sm:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono border ${
                  onlyLocalStock
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                    : 'bg-[#111827] text-slate-400 border-white/10'
                }`}
              >
                <Zap className="w-3 h-3 text-emerald-400" />
                Entrega Hoy
              </button>

              <span className="text-xs font-mono text-slate-400">
                <strong className="text-white">{filteredProducts.length}</strong> disponibles
              </span>
            </div>
          )}
        </div>

        {/* PRODUCT CATALOG GRID */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-88 rounded-2xl bg-[#111827] border border-white/[0.06] p-4 flex flex-col justify-between"
              >
                <div className="h-44 rounded-xl bg-white/5" />
                <div className="space-y-2">
                  <div className="h-4 w-2/3 bg-white/5 rounded" />
                  <div className="h-4 w-1/2 bg-white/5 rounded" />
                </div>
                <div className="h-10 bg-white/5 rounded-xl" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl bg-[#111827] border border-white/[0.08] p-8 sm:p-14 text-center max-w-xl mx-auto my-4 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-sky-400/10 border border-sky-400/25 flex items-center justify-center mx-auto text-sky-400">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white">
              Actualizando Catálogo Oficial
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Estamos preparando el nuevo lote de periféricos gamer de alto rendimiento con envío a
              toda Colombia y Pago Contraentrega.
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-2xl bg-[#111827] border border-white/[0.08] p-10 text-center space-y-4">
            <p className="text-sm text-slate-300">
              No hay productos que coincidan con tu búsqueda actual.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                setOnlyLocalStock(false);
              }}
              className="px-5 py-2.5 rounded-xl bg-sky-400 text-slate-950 font-bold text-xs uppercase tracking-wider"
            >
              Ver Todos los Productos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelectProduct={(p) => setActiveProduct(p)}
                onBuyNow={(p) => handleBuyNow(p, 1)}
                onAddToCart={(p) => handleAddToCart(p, 1)}
              />
            ))}
          </div>
        )}

        {/* TRUST SECTION */}
        <div className="mt-14 rounded-2xl bg-[#111827] border border-white/[0.08] p-5 sm:p-8">
          <div className="max-w-2xl mb-6">
            <span className="text-[11px] font-mono uppercase tracking-widest text-sky-400">
              COMPRA SEGURA EN COLOMBIA
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
              Recibe primero en tus manos. Paga en efectivo al recibir.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#090D16] border border-white/[0.06] space-y-1.5">
              <Banknote className="w-5 h-5 text-sky-400" />
              <h3 className="text-xs sm:text-sm font-bold text-white">
                Pago Contraentrega Nacional
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pagas en efectivo al transportador al recibir tu pedido en casa.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#090D16] border border-white/[0.06] space-y-1.5">
              <Zap className="w-5 h-5 text-emerald-400" />
              <h3 className="text-xs sm:text-sm font-bold text-white">Despacho Ágil</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Stock local de entrega rápida y envíos nacionales por Interrapidísimo y Envía.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#090D16] border border-white/[0.06] space-y-1.5">
              <ShieldCheck className="w-5 h-5 text-sky-400" />
              <h3 className="text-xs sm:text-sm font-bold text-white">Garantía Krono Tech</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Respaldo directo por WhatsApp y verificación de calidad en cada periférico.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#090D16] border border-white/[0.06] space-y-1.5">
              <Truck className="w-5 h-5 text-sky-400" />
              <h3 className="text-xs sm:text-sm font-bold text-white">Guía de Rastreo</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Recibe tu número de guía oficial para seguir tu paquete en tiempo real.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER (100% Público — Cero enlaces ni menciones al panel de administración) */}
      <footer className="border-t border-white/[0.08] bg-[#070A12] py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <BrandLogo variant="horizontal" size="sm" />

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400 font-mono">
            <span>ENVÍOS POR INTERRAPIDÍSIMO & ENVÍA</span>
            <span>•</span>
            <span>PAGO CONTRAENTREGA COLOMBIA</span>
            <span>•</span>
            <span>© {new Date().getFullYear()} KRONO TECH</span>
          </div>
        </div>
      </footer>

      {/* STICKY MOBILE CART BAR */}
      {totalCartItems > 0 && !isCheckoutOpen && !activeProduct && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pt-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] bg-[#0B0F19] border-t border-sky-400/30 flex items-center justify-between gap-3">
          <div>
            <span className="block text-[10px] font-mono uppercase text-sky-400">
              Tu Pedido ({totalCartItems} {totalCartItems === 1 ? 'item' : 'items'})
            </span>
            <span className="text-base font-mono font-bold text-white">
              {formatCOP(totalCartAmount)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsCheckoutOpen(true)}
            className="py-3.5 px-5 rounded-xl bg-white active:bg-sky-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2"
          >
            <Banknote className="w-4 h-4" />
            <span>Finalizar — Pago en Casa</span>
          </button>
        </div>
      )}

      {/* FLOATING WHATSAPP DIRECT BUTTON */}
      {settings?.whatsapp_number && settings.whatsapp_number !== '573000000000' && (
        <a
          href={`https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}?text=${encodeURIComponent(
            '¡Hola Krono Tech! 👋 Quiero información sobre un producto de la tienda.'
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`fixed right-4 z-30 flex items-center gap-2 px-4 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors ${
            totalCartItems > 0 ? 'bottom-20 sm:bottom-5' : 'bottom-5'
          }`}
        >
          <MessageCircle className="w-4 h-4 fill-slate-950" />
          <span className="hidden sm:inline">WhatsApp</span>
        </a>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-[#111827] border border-sky-400/40 text-white text-xs font-mono shadow-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MODAL DETALLE DE PRODUCTO */}
      <ProductDetailModal
        product={activeProduct}
        onClose={() => setActiveProduct(null)}
        onBuyNow={(prod, qty) => handleBuyNow(prod, qty)}
        onAddToCart={(prod, qty) => handleAddToCart(prod, qty)}
      />

      {/* MODAL CHECKOUT 1-PASO */}
      {settings && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          cart={cart}
          onUpdateQuantity={handleUpdateCartQty}
          onRemoveItem={handleRemoveFromCart}
          onClearCart={() => setCart([])}
          settings={settings}
        />
      )}
    </div>
  );
}
