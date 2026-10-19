'use client';

import React, { useState } from 'react';
import {
  Zap,
  Truck,
  Banknote,
  Volume2,
  ShoppingBag,
  Check,
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
  const secondaryImage = product.images?.[1] || primaryImage;
  const topSpecs = (product.specs || []).slice(0, 2);

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
      className="group relative rounded-2xl bg-[#111827] border border-white/[0.08] hover:border-sky-400/40 overflow-hidden flex flex-col justify-between transition-colors duration-150 cursor-pointer"
    >
      <div>
        {/* Image Container with pure CSS secondary image hover */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#0B0F19]">
          {/* Dynamic Top Badge: Stock Type */}
          <div className="absolute top-2.5 left-2.5 z-10 flex flex-wrap items-center gap-1.5 max-w-[78%]">
            {product.inventory_type === 'local' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#090D16]/90 text-emerald-300 border border-emerald-400/35">
                <Zap className="w-3 h-3 fill-emerald-400 text-emerald-400 shrink-0" />
                ⚡ Entrega Hoy (Local)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#090D16]/90 text-sky-300 border border-sky-400/35">
                <Truck className="w-3 h-3 text-sky-400 shrink-0" />
                🚚 Envío Gratis Contraentrega
              </span>
            )}
          </div>

          {/* Automatic Discount Tag */}
          {discount > 0 && (
            <div className="absolute top-2.5 right-2.5 z-10">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-sky-400 text-slate-950">
                -{discount}%
              </span>
            </div>
          )}

          {/* Primary Photo */}
          <img
            src={primaryImage}
            alt={product.title}
            loading="lazy"
            decoding="async"
            className={`w-full h-full object-cover ${
              secondaryImage !== primaryImage
                ? ' transition-opacity duration-200 group-hover:opacity-0'
                : ''
            }`}
          />

          {/* Secondary Hover Photo (Pure CSS, zero JS state listeners) */}
          {secondaryImage !== primaryImage && (
            <img
              src={secondaryImage}
              alt={`${product.title} vista secundaria`}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            />
          )}

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

          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Pago en Casa
          </span>
        </div>

        <div className="grid grid-cols-12 gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onBuyNow(product);
            }}
            className="col-span-9 py-2.5 px-3 rounded-xl bg-white hover:bg-sky-400 active:bg-sky-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Banknote className="w-4 h-4 shrink-0" />
            <span>Pedir Ahora</span>
          </button>

          <button
            type="button"
            onClick={handleQuickAdd}
            className="col-span-3 py-2.5 rounded-xl bg-[#1E293B] hover:bg-[#29374d] text-white border border-white/10 flex items-center justify-center transition-colors cursor-pointer"
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
