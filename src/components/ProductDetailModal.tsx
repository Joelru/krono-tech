'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ShieldCheck,
  Truck,
  Banknote,
  Zap,
  Volume2,
  Play,
  ShoppingBag,
  Check,
  ChevronLeft,
  ChevronRight,
  Cpu,
} from 'lucide-react';
import { PublicProduct } from '@/types';
import { calculateDiscountPercent, formatCOP } from '@/lib/format';
import { playSwitchSound } from '@/lib/sound-test';

interface ProductDetailModalProps {
  product: PublicProduct | null;
  onClose: () => void;
  onBuyNow: (product: PublicProduct, quantity: number) => void;
  onAddToCart: (product: PublicProduct, quantity: number) => void;
}

const DEMO_KEYS = [
  { key: 'ESC', label: 'ESC', pitch: -15, width: 'w-11 sm:w-12' },
  { key: 'W', label: 'W', pitch: 0, width: 'w-11 sm:w-12' },
  { key: 'A', label: 'A', pitch: -8, width: 'w-11 sm:w-12' },
  { key: 'S', label: 'S', pitch: 5, width: 'w-11 sm:w-12' },
  { key: 'D', label: 'D', pitch: 12, width: 'w-11 sm:w-12' },
  { key: 'SPACE', label: 'SPACE // 6.25U', pitch: -28, width: 'w-32 sm:w-44' },
];

export function ProductDetailModal({
  product,
  onClose,
  onBuyNow,
  onAddToCart,
}: ProductDetailModalProps) {
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [soundProfile, setSoundProfile] = useState<'linear' | 'tactile' | 'clicky'>('linear');

  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (product) {
      setSelectedImageIdx(0);
      setShowVideo(false);
      setQuantity(1);
      if (
        product.audio_Switch_type === 'linear' ||
        product.audio_Switch_type === 'tactile' ||
        product.audio_Switch_type === 'clicky'
      ) {
        setSoundProfile(product.audio_Switch_type);
      } else if (product.category_id === 'cat-mouses') {
        setSoundProfile('clicky');
      } else {
        setSoundProfile('linear');
      }
    }
  }, [product]);

  if (!product) return null;

  const discount = calculateDiscountPercent(product.sale_price, product.compare_price);
  const images = product.images?.length > 0 ? product.images : ['/brand/logo-full.png'];
  const hasSoundTest = Boolean(product.audio_Switch_type);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || images.length <= 1 || showVideo) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(deltaX) > 42) {
      if (deltaX < 0) {
        setSelectedImageIdx((prev) => (prev + 1) % images.length);
      } else {
        setSelectedImageIdx((prev) => (prev - 1 + images.length) % images.length);
      }
    }
    touchStartX.current = null;
  };

  const triggerKeySound = (keyId: string, pitch: number) => {
    setActiveKey(keyId);
    playSwitchSound(soundProfile, pitch);
    setTimeout(() => {
      setActiveKey((prev) => (prev === keyId ? null : prev));
    }, 120);
  };

  const handleAdd = () => {
    onAddToCart(product, quantity);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-black/85">
      <div onClick={onClose} className="fixed inset-0" />

      <div className="relative z-10 w-full max-w-5xl h-[93dvh] sm:h-auto sm:max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-[#0B0F19] border-t sm:border border-white/15 shadow-2xl text-slate-100 pb-28 sm:pb-0">
        {/* Top Bar */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[#0B0F19] border-b border-white/[0.08]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-2 w-2 rounded-full bg-sky-400 shrink-0" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 truncate">
              {product.category_name || 'KRONO TECH'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/15 text-white transition-colors shrink-0 cursor-pointer"
            aria-label="Cerrar detalle"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-7 p-4 sm:p-7">
          {/* LEFT COLUMN: Touch-Swipeable Multimedia Gallery */}
          <div className="lg:col-span-6 flex flex-col gap-3.5">
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="relative aspect-square sm:aspect-[4/3] w-full rounded-2xl overflow-hidden bg-[#111827] border border-white/[0.08] select-none"
            >
              {/* Stock Type Badge */}
              <div className="absolute top-3 left-3 z-20 flex flex-wrap gap-1.5 max-w-[85%]">
                {product.inventory_type === 'local' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#090D16]/90 text-emerald-300 border border-emerald-400/40">
                    <Zap className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                    ⚡ Entrega Hoy (Local)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#090D16]/90 text-sky-300 border border-sky-400/40">
                    <Truck className="w-3 h-3 text-sky-400" />
                    🚚 Envío Gratis Contraentrega
                  </span>
                )}

                {discount > 0 && (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-sky-400 text-slate-950">
                    -{discount}% OFF
                  </span>
                )}
              </div>

              {showVideo && product.video_url ? (
                <video
                  src={product.video_url}
                  controls
                  playsInline
                  autoPlay
                  loop
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={images[selectedImageIdx]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              )}

              {/* Prev / Next arrows & Mobile Swipe Dots */}
              {!showVideo && images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedImageIdx((prev) => (prev - 1 + images.length) % images.length)
                    }
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/70 hover:bg-black/90 text-white border border-white/15"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedImageIdx((prev) => (prev + 1) % images.length)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/70 hover:bg-black/90 text-white border border-white/15"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70">
                    {images.map((_, i) => (
                      <span
                        key={i}
                        className={`h-1.5 rounded-full ${
                          i === selectedImageIdx ? 'w-5 bg-sky-400' : 'w-1.5 bg-white/40'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnails & Video Switcher */}
            {(images.length > 1 || product.video_url) && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setShowVideo(false);
                      setSelectedImageIdx(idx);
                    }}
                    className={`relative h-14 w-16 sm:h-16 sm:w-20 rounded-xl overflow-hidden shrink-0 border ${
                      !showVideo && selectedImageIdx === idx
                        ? 'border-sky-400'
                        : 'border-white/10 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}

                {product.video_url && (
                  <button
                    type="button"
                    onClick={() => setShowVideo(true)}
                    className={`flex items-center gap-1.5 h-14 sm:h-16 px-3.5 rounded-xl shrink-0 border text-xs font-mono uppercase tracking-wider ${
                      showVideo
                        ? 'border-sky-400 bg-sky-400/15 text-sky-300'
                        : 'border-white/10 bg-[#111827] text-slate-300'
                    }`}
                  >
                    <Play className="w-4 h-4 fill-current text-sky-400" />
                    Video
                  </button>
                )}
              </div>
            )}

            {/* Interactive Acoustic Sound Test (Only if enabled on product) */}
            {hasSoundTest && (
              <div className="rounded-2xl bg-[#111827] border border-sky-400/20 p-3.5 sm:p-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <Volume2 className="w-4 h-4 text-sky-400" />
                  <span className="text-[11px] font-mono uppercase tracking-wider text-sky-300 font-semibold">
                    Sound Test Interactivo
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 py-1">
                  {DEMO_KEYS.map((k) => {
                    const isPressed = activeKey === k.key;
                    return (
                      <button
                        key={k.key}
                        type="button"
                        onClick={() => triggerKeySound(k.key, k.pitch)}
                        className={`${k.width} h-10 sm:h-11 rounded-xl font-mono text-[11px] font-bold tracking-wider border select-none flex items-center justify-center ${
                          isPressed
                            ? 'bg-sky-400 text-slate-950 border-sky-300'
                            : 'bg-[#1E293B] text-slate-200 border-white/15'
                        }`}
                      >
                        {k.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Commercial Info, Trust Block, Technical Specs & CTAs */}
          <div className="lg:col-span-6 flex flex-col justify-between gap-4">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-1.5">
                {product.badges?.map((b, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider bg-sky-400/10 text-sky-300 border border-sky-400/25"
                  >
                    {b}
                  </span>
                ))}
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                  ● Disponible ({product.stock} und)
                </span>
              </div>

              <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-white leading-snug">
                {product.title}
              </h2>

              {/* Price & Quantity Block */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#111827] border border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight">
                      {formatCOP(product.sale_price)}
                    </span>
                    {product.compare_price && product.compare_price > product.sale_price && (
                      <span className="text-xs sm:text-sm font-mono text-slate-500 line-through">
                        {formatCOP(product.compare_price, false)}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-emerald-400 mt-1">
                    ✓ Pagas en efectivo al recibir en tu casa
                  </p>
                </div>

                {/* Quantity Selector */}
                <div className="flex items-center gap-1.5 bg-[#0B0F19] px-2.5 py-1.5 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-lg bg-white/5 active:bg-white/15 text-white font-mono text-base flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="w-7 text-center font-mono text-sm font-bold text-white">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(product.stock || 10, q + 1))}
                    className="w-8 h-8 rounded-lg bg-white/5 active:bg-white/15 text-white font-mono text-base flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Desktop Conversion Buttons */}
              <div className="hidden sm:grid grid-cols-12 gap-3">
                <button
                  type="button"
                  onClick={() => onBuyNow(product, quantity)}
                  className="col-span-8 py-4 px-6 rounded-xl bg-white hover:bg-sky-400 text-slate-950 font-bold text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Banknote className="w-5 h-5" />
                  Pedir Ahora — Pago en Casa
                </button>

                <button
                  type="button"
                  onClick={handleAdd}
                  className="col-span-4 py-4 px-4 rounded-xl bg-[#1E293B] hover:bg-[#283548] text-white font-semibold text-xs uppercase tracking-wider border border-white/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {addedFeedback ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      Listo
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 text-sky-400" />
                      Al Carrito
                    </>
                  )}
                </button>
              </div>

              {/* Bloque de Confianza */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 sm:p-3 rounded-xl bg-[#111827] border border-white/[0.06] flex flex-col items-center text-center gap-1">
                  <Banknote className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" />
                  <span className="text-[10px] sm:text-[11px] font-semibold text-white leading-tight">
                    Pago Contraentrega
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 leading-tight">
                    Efectivo al recibir
                  </span>
                </div>
                <div className="p-2.5 sm:p-3 rounded-xl bg-[#111827] border border-white/[0.06] flex flex-col items-center text-center gap-1">
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" />
                  <span className="text-[10px] sm:text-[11px] font-semibold text-white leading-tight">
                    Garantía Krono Tech
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 leading-tight">
                    Calidad verificada
                  </span>
                </div>
                <div className="p-2.5 sm:p-3 rounded-xl bg-[#111827] border border-white/[0.06] flex flex-col items-center text-center gap-1">
                  <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" />
                  <span className="text-[10px] sm:text-[11px] font-semibold text-white leading-tight">
                    Envío Seguro
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 leading-tight">
                    Interrapidísimo / Envía
                  </span>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="space-y-1.5">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400">
                    Descripción del Producto
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Technical Specifications Table */}
              {product.specs && product.specs.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-sky-400" />
                    <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400">
                      Ficha Técnica
                    </h3>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-[#111827] divide-y divide-white/[0.06]">
                    {product.specs.map((spec, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-12 px-3.5 py-2.5 text-xs items-center"
                      >
                        <span className="col-span-5 font-mono text-slate-400">
                          {spec.label}
                        </span>
                        <span className="col-span-7 font-mono font-semibold text-slate-100">
                          {spec.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* STICKY CTA EN MÓVIL */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pt-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] bg-[#090D16] border-t border-white/15 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="block text-[10px] font-mono uppercase text-sky-400">
              Total ({quantity} {quantity === 1 ? 'und' : 'unds'})
            </span>
            <span className="text-base font-mono font-bold text-white truncate block">
              {formatCOP(product.sale_price * quantity)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className="p-3.5 rounded-xl bg-[#1E293B] active:bg-slate-700 text-sky-400 border border-white/10 shrink-0"
            aria-label="Agregar al carrito"
          >
            {addedFeedback ? (
              <Check className="w-5 h-5 text-emerald-400" />
            ) : (
              <ShoppingBag className="w-5 h-5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onBuyNow(product, quantity)}
            className="flex-1 py-3.5 px-4 rounded-xl bg-white active:bg-sky-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
          >
            <Banknote className="w-4 h-4 shrink-0" />
            <span>Pedir Ahora - Pago en Casa</span>
          </button>
        </div>
      </div>
    </div>
  );
}
