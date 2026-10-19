'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Banknote,
  QrCode,
  ShieldCheck,
  Truck,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Plus,
  Minus,
  ExternalLink,
  Sparkles,
  MapPin,
  Phone,
  User,
  Home,
} from 'lucide-react';
import { CartItem, PaymentMethod, StoreSettings } from '@/types';
import { COLOMBIA_LOCATIONS } from '@/lib/colombia-locations';
import { formatCOP, isValidColombianPhone } from '@/lib/format';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  settings: StoreSettings;
}

export function CheckoutModal({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  settings,
}: CheckoutModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [department, setDepartment] = useState('Bogotá D.C.');
  const [city, setCity] = useState('Bogotá D.C.');
  const [address, setAddress] = useState('');
  const [neighborhoodRef, setNeighborhoodRef] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<{
    order_number: string;
    total_amount: number;
    whatsapp_url: string;
  } | null>(null);

  const availableCities = useMemo(() => {
    const found = COLOMBIA_LOCATIONS.find((d) => d.department === department);
    return found ? found.cities : [];
  }, [department]);

  const handleDepartmentChange = (newDept: string) => {
    setDepartment(newDept);
    const found = COLOMBIA_LOCATIONS.find((d) => d.department === newDept);
    if (found && found.cities.length > 0) {
      setCity(found.cities[0]);
    } else {
      setCity('');
    }
  };

  const subtotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.product.sale_price * item.quantity, 0),
    [cart]
  );

  const transferDiscountPercent = Number(settings?.payment_qr_info?.transfer_discount_percent || 0);
  const discountAmount =
    paymentMethod === 'transfer' ? Math.round(subtotal * (transferDiscountPercent / 100)) : 0;
  const totalAmount = Math.max(0, subtotal - discountAmount);

  const cleanPhone = customerPhone.replace(/\D/g, '');
  const phoneValid = isValidColombianPhone(cleanPhone);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (cart.length === 0) {
      setErrorMsg('Tu carrito está vacío.');
      return;
    }

    if (customerName.trim().length < 4) {
      setErrorMsg('Por favor ingresa tu Nombre y Apellidos completos.');
      return;
    }

    if (!phoneValid) {
      setErrorMsg(
        'El Celular / WhatsApp debe tener exactamente 10 dígitos numéricos y empezar por 3 (Ej: 3001234567).'
      );
      return;
    }

    if (!department || !city) {
      setErrorMsg('Selecciona tu Departamento y Ciudad.');
      return;
    }

    if (address.trim().length < 6) {
      setErrorMsg('Ingresa tu dirección exacta (Calle/Carrera, Número, Apto/Casa).');
      return;
    }

    if (neighborhoodRef.trim().length < 5) {
      setErrorMsg(
        'Por favor incluye el Barrio y un Punto de Referencia para evitar devoluciones de la transportadora.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName.trim(),
          customer_phone: cleanPhone,
          department,
          city,
          address: address.trim(),
          neighborhood_reference: neighborhoodRef.trim(),
          payment_method: paymentMethod,
          cartItems: cart.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMsg(data.error || 'Error procesando el pedido.');
        setSubmitting(false);
        return;
      }

      setConfirmedOrder({
        order_number: data.order.order_number,
        total_amount: data.order.total_amount,
        whatsapp_url: data.whatsapp_url,
      });

      onClearCart();
      setSubmitting(false);

      if (data.whatsapp_url) {
        window.open(data.whatsapp_url, '_blank', 'noopener,noreferrer');
      }
    } catch {
      setErrorMsg('Error de conexión al registrar tu pedido. Intenta de nuevo.');
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setConfirmedOrder(null);
    setErrorMsg(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/85">
      <div onClick={resetAndClose} className="fixed inset-0" />

      <div className="relative z-10 w-full max-w-xl h-[100dvh] bg-[#090D16] border-l border-white/10 shadow-2xl flex flex-col text-slate-100 overflow-hidden">
        {/* Drawer Header */}
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 bg-[#111827] border-b border-white/[0.08] flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-sky-400">
                CHECKOUT RÁPIDO 1-PASO // COLOMBIA
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
              {confirmedOrder
                ? `¡Pedido #${confirmedOrder.order_number} Registrado!`
                : 'Datos de Envío — Pago en Casa'}
            </h2>
          </div>

          <button
            onClick={resetAndClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/15 text-white transition-colors cursor-pointer"
            aria-label="Cerrar checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {confirmedOrder ? (
            <div className="p-5 sm:p-6 rounded-2xl bg-[#111827] border border-emerald-500/30 text-center space-y-5 my-2">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1.5">
                <span className="px-3 py-1 rounded-full text-xs font-mono bg-sky-400/15 text-sky-300 border border-sky-400/30">
                  ORDEN OFICIAL #{confirmedOrder.order_number}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white pt-2">
                  ¡Tu pedido está listo para despacho!
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                  Orden registrada por un total de{' '}
                  <span className="font-mono font-bold text-white">
                    {formatCOP(confirmedOrder.total_amount)}
                  </span>
                  .
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#090D16] border border-white/10 text-left text-xs text-slate-300 space-y-1">
                <p className="font-semibold text-sky-400 uppercase font-mono">
                  Confirma tu despacho en WhatsApp:
                </p>
                <p>
                  Toca el botón verde para enviar tus datos pre-estructurados a nuestro WhatsApp y
                  generar tu guía hoy mismo.
                </p>
              </div>

              <a
                href={confirmedOrder.whatsapp_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
              >
                <span>Enviar Pedido por WhatsApp</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={resetAndClose}
                className="text-xs font-mono text-slate-400 hover:text-white underline"
              >
                Volver a la tienda
              </button>
            </div>
          ) : cart.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <p className="text-slate-400 text-sm">Tu resumen de compra está vacío.</p>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-xl bg-sky-400 text-slate-950 font-bold text-xs uppercase tracking-wider"
              >
                Ver Catálogo
              </button>
            </div>
          ) : (
            <form id="krono-checkout-form" onSubmit={handleSubmit} className="space-y-5">
              {/* Order Summary Box */}
              <div className="rounded-2xl bg-[#111827] border border-white/[0.08] p-3.5 sm:p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    Tu Pedido ({cart.reduce((a, b) => a + b.quantity, 0)} und)
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" /> Envío Gratis
                  </span>
                </div>

                <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center justify-between gap-2.5 bg-[#090D16] p-2.5 rounded-xl border border-white/[0.05]"
                    >
                      <img
                        src={item.product.images[0] || '/brand/logo-icon.png'}
                        alt={item.product.title}
                        className="w-12 h-12 rounded-lg object-cover shrink-0 border border-white/10"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-white truncate">
                          {item.product.title}
                        </h4>
                        <p className="text-xs font-mono text-sky-400">
                          {formatCOP(item.product.sale_price)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-white/5 active:bg-white/15 text-slate-200 flex items-center justify-center"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center font-mono text-xs font-bold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-white/5 active:bg-white/15 text-slate-200 flex items-center justify-center"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.product.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400"
                          title="Quitar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Customer Shipping Fields */}
              <div className="space-y-3.5">
                <h3 className="text-xs font-mono uppercase tracking-widest text-sky-400 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" />
                  1. Datos para la Transportadora
                </h3>

                {/* 1. Nombre y Apellidos */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nombre y Apellidos completos <span className="text-sky-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      autoComplete="name"
                      placeholder="Ej: Juan José Martínez"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#111827] border border-white/10 focus:border-sky-400 focus:outline-none text-base sm:text-sm text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {/* 2. Celular / WhatsApp (10 dígitos, empieza por 3) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-300">
                      Celular / WhatsApp <span className="text-sky-400">*</span>
                    </label>
                    <span
                      className={`text-[11px] font-mono ${
                        cleanPhone.length === 0
                          ? 'text-slate-500'
                          : phoneValid
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {cleanPhone.length}/10 dígitos {phoneValid ? '✓ Válido' : '(Empieza por 3)'}
                    </span>
                  </div>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="tel"
                      required
                      maxLength={10}
                      placeholder="3001234567"
                      value={customerPhone}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setCustomerPhone(digitsOnly);
                      }}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl bg-[#111827] border font-mono text-base sm:text-sm text-white placeholder:text-slate-500 focus:outline-none ${
                        cleanPhone.length > 0 && !phoneValid
                          ? 'border-amber-500/60 focus:border-amber-400'
                          : phoneValid
                          ? 'border-emerald-500/50 focus:border-emerald-400'
                          : 'border-white/10 focus:border-sky-400'
                      }`}
                    />
                  </div>
                </div>

                {/* 3. Departamento y Municipio/Ciudad */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Departamento <span className="text-sky-400">*</span>
                    </label>
                    <select
                      value={department}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-xl bg-[#111827] border border-white/10 focus:border-sky-400 focus:outline-none text-base sm:text-sm text-white"
                    >
                      {COLOMBIA_LOCATIONS.map((d) => (
                        <option key={d.department} value={d.department} className="bg-[#0B0F19]">
                          {d.department}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Municipio / Ciudad <span className="text-sky-400">*</span>
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-xl bg-[#111827] border border-white/10 focus:border-sky-400 focus:outline-none text-base sm:text-sm text-white"
                    >
                      {availableCities.map((c) => (
                        <option key={c} value={c} className="bg-[#0B0F19]">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 4. Dirección Exacta + Barrio + Punto de Referencia */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Dirección Exacta (Calle/Cra, Número, Apto/Casa){' '}
                    <span className="text-sky-400">*</span>
                  </label>
                  <div className="relative">
                    <Home className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      autoComplete="street-address"
                      placeholder="Ej: Calle 85 # 15-24 Apto 502"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#111827] border border-white/10 focus:border-sky-400 focus:outline-none text-base sm:text-sm text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Barrio + Punto de Referencia (Obligatorio){' '}
                    <span className="text-sky-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Barrio El Poblado, frente al supermercado D1"
                    value={neighborhoodRef}
                    onChange={(e) => setNeighborhoodRef(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl bg-[#111827] border border-white/10 focus:border-sky-400 focus:outline-none text-base sm:text-sm text-white placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* 5. Selector de Método de Pago */}
              <div className="space-y-2.5 pt-1">
                <h3 className="text-xs font-mono uppercase tracking-widest text-sky-400 flex items-center gap-2">
                  <Banknote className="w-3.5 h-3.5" />
                  2. Método de Pago
                </h3>

                <div className="grid grid-cols-1 gap-2.5">
                  {/* Opción A: Contraentrega */}
                  <label
                    onClick={() => setPaymentMethod('cod')}
                    className={`cursor-pointer p-3.5 rounded-2xl border transition-colors flex items-start gap-3 ${
                      paymentMethod === 'cod'
                        ? 'bg-sky-400/10 border-sky-400'
                        : 'bg-[#111827] border-white/10'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="mt-1 accent-sky-400"
                    />
                    <div className="flex-1">
                      <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                        <Banknote className="w-4 h-4 text-emerald-400 shrink-0" />
                        Pago Contraentrega (Efectivo en Casa)
                      </span>
                      <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
                        Pagas en efectivo únicamente cuando recibas el paquete en tus manos.
                      </p>
                    </div>
                  </label>

                  {/* Opción B: Nequi / Bancolombia */}
                  <label
                    onClick={() => setPaymentMethod('transfer')}
                    className={`cursor-pointer p-3.5 rounded-2xl border transition-colors flex items-start gap-3 ${
                      paymentMethod === 'transfer'
                        ? 'bg-sky-400/10 border-sky-400'
                        : 'bg-[#111827] border-white/10'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'transfer'}
                      onChange={() => setPaymentMethod('transfer')}
                      className="mt-1 accent-sky-400"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                          <QrCode className="w-4 h-4 text-sky-400 shrink-0" />
                          Transferencia Nequi / Bancolombia
                        </span>
                        {transferDiscountPercent > 0 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-400 text-slate-950 shrink-0">
                            -{transferDiscountPercent}%
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
                        {settings?.payment_qr_info?.transfer_benefit_text ||
                          'Despacho Prioritario + Descuento por transferencia.'}
                      </p>

                      {paymentMethod === 'transfer' && (
                        <div className="mt-3 p-3 rounded-xl bg-[#090D16] border border-sky-400/30 space-y-1.5 text-xs">
                          {settings?.payment_qr_info?.nequi_number && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Nequi:</span>
                              <span className="font-mono font-bold text-sky-300">
                                {settings.payment_qr_info.nequi_number}
                              </span>
                            </div>
                          )}
                          {settings?.payment_qr_info?.bancolombia_account && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">
                                {settings.payment_qr_info.bancolombia_type || 'Bancolombia'}:
                              </span>
                              <span className="font-mono font-bold text-sky-300">
                                {settings.payment_qr_info.bancolombia_account}
                              </span>
                            </div>
                          )}
                          {settings?.payment_qr_info?.nequi_holder && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Titular:</span>
                              <span className="font-mono text-slate-200">
                                {settings.payment_qr_info.nequi_holder}
                              </span>
                            </div>
                          )}
                          {settings?.payment_qr_info?.qr_image_url && (
                            <div className="pt-2 flex justify-center">
                              <img
                                src={settings.payment_qr_info.qr_image_url}
                                alt="QR Pago Krono Tech"
                                className="w-36 h-36 rounded-lg object-contain border border-white/10 bg-white p-1"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Drawer Sticky Footer with Mobile Safe Area */}
        {!confirmedOrder && cart.length > 0 && (
          <div className="px-4 sm:px-5 pt-3.5 pb-[max(1rem,env(safe-area-inset-bottom))] bg-[#111827] border-t border-white/10 space-y-3 shrink-0">
            <div className="space-y-1 text-xs">
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Ahorro Transferencia (
                    {transferDiscountPercent}%)
                  </span>
                  <span className="font-mono">- {formatCOP(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline text-sm sm:text-base font-bold text-white">
                <span>Total a Pagar ({city})</span>
                <span className="text-lg sm:text-xl font-mono text-sky-400">
                  {formatCOP(totalAmount)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              form="krono-checkout-form"
              disabled={submitting}
              className="w-full py-4 px-5 rounded-xl bg-white active:bg-sky-400 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold text-xs sm:text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <span>
                {submitting
                  ? 'Procesando Pedido...'
                  : paymentMethod === 'cod'
                  ? 'Confirmar Pedido Contraentrega'
                  : 'Confirmar Pedido por WhatsApp'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
