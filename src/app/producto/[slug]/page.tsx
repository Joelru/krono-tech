'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProductDetailModal } from '@/components/ProductDetailModal';
import { CheckoutModal } from '@/components/CheckoutModal';
import { CartItem, PublicProduct, StoreSettings } from '@/types';

export default function DirectProductPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    if (!params?.slug) return;
    fetch(`/api/products/${params.slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.product) {
          setProduct(data.product);
          setSettings(data.settings);
        } else {
          router.push('/');
        }
      })
      .catch(() => router.push('/'));
  }, [params?.slug, router]);

  return (
    <div className="min-h-screen bg-[#090D16]">
      <ProductDetailModal
        product={product}
        onClose={() => router.push('/')}
        onBuyNow={(prod, qty) => {
          setCart([{ product: prod, quantity: qty }]);
          setCheckoutOpen(true);
        }}
        onAddToCart={(prod, qty) => {
          setCart([{ product: prod, quantity: qty }]);
          setCheckoutOpen(true);
        }}
      />

      {settings && (
        <CheckoutModal
          isOpen={checkoutOpen}
          onClose={() => {
            setCheckoutOpen(false);
            router.push('/');
          }}
          cart={cart}
          onUpdateQuantity={(id, q) =>
            setCart((prev) =>
              q <= 0
                ? prev.filter((i) => i.product.id !== id)
                : prev.map((i) => (i.product.id === id ? { ...i, quantity: q } : i))
            )
          }
          onRemoveItem={(id) => setCart((prev) => prev.filter((i) => i.product.id !== id))}
          onClearCart={() => setCart([])}
          settings={settings}
        />
      )}
    </div>
  );
}
