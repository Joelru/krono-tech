'use client';

import React, { useState } from 'react';
import {
  Zap,
  Truck,
  Banknote,
  Volume2,
  ShoppingBag,
  Check,
  Clock,
} from 'lucide-react';
import { PublicProduct } from '@/types';
import { calculateDiscountPercent, formatCOP } from '@/lib/format';
import { playSwitchSound } from '@/lib/sound-test';

interface ProductCardProps {
  product: PublicProduct;
  onSelectProduct: (product: PublicProduct) => void;
  onBuyNow: (product: PublicProduct) => void;
  onAddToCart: (product: PublicProduct) => void;
}

export function ProductCard({
  product,
  onSelectProduct,
  onBuyNow,
  onAddToCart,
}: ProductCardProps) {
  const [added, setAdded] = useState(false);

  const discount = calculateDiscountPercent(product.sale_price, product.compare_price);
  const primaryImage = product.images?.[0] || '/brand/logo-full.png';
  const topSpecs = (product.specs || []).slice(0, 2);
  const isPreorder = product.inventory_type === 'preorder';

  const handleQuickSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const type =
      product.audio_Switch_type === 'tactile'
        ? 'tactile'
        : product.audio_Switch_type === 'clicky' || product.category_id === 'cat-mouses'
        ? 'clicky'
        : 'linear';
    playSwitchSound(type, 0);
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <article
      onClick={() => onSelectProduct(product)}
      className="group relative rounded-2xl bg-[#111827] border border-white/[0.08] hover:border-sky-400/45 overflow-hidden flex flex-col justify-between transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_14px_34px_-12px_rgba(56,189,248,0.2)] cursor-pointer"
    >
      <div>
        {/* Image Container with smooth subtle zoom-in on primary image */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#0B0F19]">
          {/* Dynamic Top Badge: 3 Availability States */}
          <div className="absolute top-2.5 left-2.5 z-10 flex flex-wrap items-center gap-1.5 max-w-[82%]">
            {product.inventory_type === 'local' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold bg-[#090D16]/90 text-emerald-300 border border-emerald-400/40">
                <Zap className="w-3 h-3 fill-emerald-400 text-emerald-400 shrink-0" />
                ⚡ En Stock (Hoy Ocaña 5:00 PM)
              </span>
            ) : isPreorder ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold bg-[#090D16]/95 text-amber-300 border border-amber-400/45">
                <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                ⏳ Próximo Lote (Separa con $0)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold bg-[#090D16]/90 text-sky-300 border border-sky-400/35">
                <Truck className="w-3 h-3 text-sky-400 shrink-0" />
                🚚 Envío Nacional (2 a 4 días)
              </span>
            )}
          </div>

          {/* Automatic Discount Tag */}
          {discount > 0 && (
            <div className="absolute top-2.5 right-2.5 z-10">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-sky-400 text-slate-950 shadow-sm">
                -{discount}%
              </span>
            </div>
          )}

          {/* Primary Photo with subtle GPU zoom-in on hover */}
          <img
            src={primaryImage}
            alt={product.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105 will-change-transform"
          />

          {/* Optional Sound Test Button */}
          {product.audio_Switch_type && (
            <div className="absolute bottom-2.5 left-2.5 z-10">
              <button
                type="button"
                onClick={handleQuickSound}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono bg-[#090D16]/90 text-sky-300 border border-sky-400/30 hover:bg-sky-400 hover:text-slate-950 transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5" />
                SOUND TEST
              </button>
            </div>
          )}
        </div>

        {/* Product Info Body */}
        <div className="p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400">
              {product.category_name || 'HARDWARE'}
            </span>
            {product.badges?.[0] && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
                {product.badges[0]}
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors line-clamp-2 leading-snug">
            {product.title}
          </h3>

          {/* Preorder Arrival Date Banner */}
          {isPreorder && product.estimated_arrival_date && (
            <div className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-400/30 text-[11px] font-mono text-amber-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span className="truncate">{product.estimated_arrival_date}</span>
            </div>
          )}

          {/* 2 Key Specs in Monospace Pills */}
          {topSpecs.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {topSpecs.map((spec, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-[#1E293B] text-slate-200 border border-white/[0.07]"
                >
                  [{spec.value}]
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Price & Conversion Footer */}
      <div className="p-4 pt-0 space-y-3">
        <div className="flex items-baseline justify-between border-t border-white/[0.07] pt-3">
          <div>
            {product.compare_price && product.compare_price > product.sale_price && (
              <span className="block text-xs font-mono text-slate-500 line-through">
                {formatCOP(product.compare_price, false)}
              </span>
            )}
            <span className="text-lg font-mono font-bold text-white tracking-tight">
              {formatCOP(product.sale_price)}
            </span>
          </div>

          {isPreorder ? (
            <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-400/30">
              Separa con $0
            </span>
          ) : (
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Pago en Casa
            </span>
          )}
        </div>

        <div className="grid grid-cols-12 gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onBuyNow(product);
            }}
            className={`col-span-9 py-2.5 px-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] ${
              isPreorder
                ? 'bg-sky-400 hover:bg-cyan-300 text-slate-950 shadow-[0_0_16px_rgba(56,189,248,0.25)]'
                : 'bg-white hover:bg-sky-400 active:bg-sky-400 text-slate-950'
            }`}
          >
            {isPreorder ? (
              <>
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Reservar Unidad (Pagas cuando llegue)</span>
              </>
            ) : (
              <>
                <Banknote className="w-4 h-4 shrink-0" />
                <span>Pedir Ahora</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleQuickAdd}
            className="col-span-3 py-2.5 rounded-xl bg-[#1E293B] hover:bg-[#29374d] active:scale-[0.96] text-white border border-white/10 flex items-center justify-center transition-all duration-150 cursor-pointer"
            title="Agregar al carrito"
          >
            {added ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <ShoppingBag className="w-4 h-4 text-sky-400" />
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
