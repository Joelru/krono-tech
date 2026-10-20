'use client';

import React, { useState } from 'react';
import {
  Laptop,
  Monitor,
  Cpu,
  Gamepad2,
  Code2,
  GraduationCap,
  Palette,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  User,
  Phone,
  MapPin,
  MessageSquare,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { QuoteEquipmentType } from '@/types';
import { buildWhatsAppQuoteUrl } from '@/lib/format';

interface CustomPcQuoteSectionProps {
  whatsappNumber: string;
}

const USE_OPTIONS = [
  {
    id: 'Estudio / Universidad / Oficina rápida',
    label: 'Estudio / Universidad / Oficina rápida',
    desc: 'Fluidez total en multitarea, Office, investigación y batería duradera.',
    icon: GraduationCap,
  },
  {
    id: 'Programación / Ingeniería / IA & Datos',
    label: 'Programación / Ingeniería / IA & Datos',
    desc: 'Compilación veloz, Docker, máquinas virtuales, AutoCAD, SolidWorks y modelos IA.',
    icon: Code2,
  },
  {
    id: 'Gaming Competitivo (Valorant, Warzone, Fortnite, Warframe, etc.)',
    label: 'Gaming Competitivo (Valorant, Warzone, Fortnite, Warframe, etc.)',
    desc: 'Altos FPS estables, gráficas dedicadas RTX/Radeon y pantallas de alta tasa de refresco.',
    icon: Gamepad2,
  },
  {
    id: 'Diseño Gráfico / Edición de Video / Streaming',
    label: 'Diseño Gráfico / Edición de Video / Streaming',
    desc: 'Renderizado rápido en Premiere, After Effects, Photoshop, Blender y OBS.',
    icon: Palette,
  },
];

const BUDGET_OPTIONS = [
  {
    value: '$1.2M - $1.8M',
    tag: 'ENTRADA PRO / ESTUDIO & OFICINA',
    desc: 'Equipos con SSD NVMe y procesadores modernos sin pagar sobreprecios.',
  },
  {
    value: '$1.8M - $2.5M',
    tag: 'BALANCE CALIDAD / PRECIO',
    desc: 'Ideal para ingeniería, programación, multitarea pesada y eSports.',
  },
  {
    value: '$2.5M - $3.5M',
    tag: 'GAMING & CREACIÓN DE CONTENIDO',
    desc: 'Gráficos dedicados, 16GB-32GB RAM y pantallas 144Hz+.',
  },
  {
    value: '$3.5M+ (Alto Rendimiento)',
    tag: 'ENTUSIASTA / EXTREMO',
    desc: 'Workstations y PCs/Portátiles Gamer de gama alta para máximo desempeño.',
  },
];

export function CustomPcQuoteSection({ whatsappNumber }: CustomPcQuoteSectionProps) {
  const [step, setStep] = useState<number>(1);
  const [equipmentType, setEquipmentType] = useState<QuoteEquipmentType>('portatil');
  const [selectedUses, setSelectedUses] = useState<string[]>([
    'Gaming Competitivo (Valorant, Warzone, Fortnite, Warframe, etc.)',
  ]);
  const [budgetRange, setBudgetRange] = useState<string>('$2.5M - $3.5M');
  const [comments, setComments] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerCity, setCustomerCity] = useState<string>('Ocaña');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedQuote, setSubmittedQuote] = useState<{
    quote_number: string;
    whatsapp_url: string;
  } | null>(null);

  const cleanPhone = customerPhone.replace(/\D/g, '');
  const isPhoneValid = cleanPhone.length === 10;

  const toggleUse = (useLabel: string) => {
    setSelectedUses((prev) => {
      if (prev.includes(useLabel)) {
        if (prev.length === 1) return prev; // Keep at least 1 selected
        return prev.filter((u) => u !== useLabel);
      }
      return [...prev, useLabel];
    });
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (selectedUses.length === 0) {
      setErrorMsg('Selecciona al menos un uso principal en el Paso 2.');
      setStep(2);
      return;
    }

    if (!budgetRange) {
      setErrorMsg('Selecciona un rango de presupuesto en el Paso 3.');
      setStep(3);
      return;
    }

    if (customerName.trim().length < 2) {
      setErrorMsg('Por favor ingresa tu nombre para personalizar la cotización.');
      return;
    }

    if (!isPhoneValid) {
      setErrorMsg('Ingresa un número de WhatsApp válido de 10 dígitos (Ej: 3001234567).');
      return;
    }

    if (customerCity.trim().length < 2) {
      setErrorMsg('Por favor indica tu ciudad (Ej: Ocaña).');
      return;
    }

    const fallbackWhatsappUrl = buildWhatsAppQuoteUrl(
      {
        equipment_type: equipmentType,
        primary_uses: selectedUses,
        budget_range: budgetRange,
        comments: comments.trim(),
        customer_name: customerName.trim(),
        customer_city: customerCity.trim(),
      },
      whatsappNumber
    );

    setSubmitting(true);
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipment_type: equipmentType,
          primary_uses: selectedUses,
          budget_range: budgetRange,
          comments: comments.trim(),
          customer_name: customerName.trim(),
          customer_phone: cleanPhone,
          customer_city: customerCity.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Error guardando tu solicitud.');
        setSubmitting(false);
        return;
      }

      const finalWaUrl = data.whatsapp_url || fallbackWhatsappUrl;
      setSubmittedQuote({
        quote_number: data.quote?.quote_number || 'COT-KRONO',
        whatsapp_url: finalWaUrl,
      });
      setSubmitting(false);

      window.open(finalWaUrl, '_blank', 'noopener,noreferrer');
    } catch {
      // Even if offline/network issue, open WhatsApp directly so lead isn't lost
      setSubmittedQuote({
        quote_number: 'COT-DIRECT',
        whatsapp_url: fallbackWhatsappUrl,
      });
      setSubmitting(false);
      window.open(fallbackWhatsappUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <section
      id="cotizador-pcs"
      className="relative scroll-mt-28 py-10 sm:py-14 border-b border-white/[0.08] bg-gradient-to-b from-[#090D16] via-[#0B1222] to-[#090D16]"
    >
      {/* Subtle Cyan Engineering Glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[680px] h-[220px] bg-sky-500/10 blur-[110px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-400/10 border border-sky-400/30">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-sky-300 font-semibold">
                COTIZADOR INTERACTIVO // PORTÁTILES & PCs BAJO PEDIDO
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Portátiles & PCs Gamer{' '}
              <span className="text-sky-400">a Medida.</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Te ayudamos a comprar el computador exacto que necesitas a un{' '}
              <strong className="text-white">precio justo de importador</strong>, sin que te
              engañen con procesadores viejos o precios inflados en almacenes de cadena.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-300">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111827] border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Asesoría Honesta 1 a 1
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111827] border border-white/10">
              <Cpu className="w-3.5 h-3.5 text-sky-400" />
              Ocaña & Envíos a Colombia
            </span>
          </div>
        </div>

        {submittedQuote ? (
          <div className="rounded-3xl bg-[#111827] border border-emerald-400/35 p-6 sm:p-10 text-center max-w-2xl mx-auto space-y-5 shadow-[0_20px_60px_rgba(0,0,0,0.65)]">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <span className="px-3 py-1 rounded-full text-xs font-mono bg-sky-400/15 text-sky-300 border border-sky-400/30">
                SOLICITUD #{submittedQuote.quote_number} GUARDADA
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white pt-1">
                ¡Tu solicitud de cotización está lista!
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
                Hemos registrado tus requerimientos en nuestro sistema y abrimos WhatsApp para
                enviarte las mejores opciones calidad/precio disponibles hoy.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href={submittedQuote.whatsapp_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs sm:text-sm uppercase tracking-wider transition flex items-center justify-center gap-2"
              >
                <span>Abrir Cotización en WhatsApp</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={() => {
                  setSubmittedQuote(null);
                  setStep(1);
                }}
                className="w-full sm:w-auto px-5 py-4 rounded-xl bg-[#1E293B] hover:bg-slate-700 text-xs font-mono text-slate-200 border border-white/10 transition cursor-pointer"
              >
                Armar otra cotización
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT / MAIN: 4-STEP INTERACTIVE WIZARD */}
            <div className="lg:col-span-8 rounded-3xl bg-[#111827] border border-white/10 p-4 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-6">
              {/* Stepper Navigation Bar */}
              <div className="grid grid-cols-4 gap-2 pb-4 border-b border-white/[0.08]">
                {[
                  { num: 1, title: '1. Equipo' },
                  { num: 2, title: '2. Uso Principal' },
                  { num: 3, title: '3. Presupuesto' },
                  { num: 4, title: '4. Contacto' },
                ].map((s) => {
                  const isCurrent = step === s.num;
                  const isDone = step > s.num;
                  return (
                    <button
                      key={s.num}
                      type="button"
                      onClick={() => setStep(s.num)}
                      className={`py-2.5 px-2 sm:px-3 rounded-xl font-mono text-[11px] sm:text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                        isCurrent
                          ? 'bg-sky-400 text-slate-950 border-sky-300 shadow-[0_0_20px_rgba(56,189,248,0.3)]'
                          : isDone
                          ? 'bg-sky-400/15 text-sky-300 border-sky-400/35'
                          : 'bg-[#090D16] text-slate-400 border-white/[0.07] hover:text-white'
                      }`}
                    >
                      <span className="truncate">{s.title}</span>
                    </button>
                  );
                })}
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* STEP 1: ¿QUÉ ESTÁS BUSCANDO? */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-sky-400">
                      PASO 1 DE 4 // TIPO DE MÁQUINA
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                      ¿Qué estás buscando?
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Selecciona el formato de equipo que deseas cotizar bajo pedido.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setEquipmentType('portatil');
                        setStep(2);
                      }}
                      className={`text-left p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                        equipmentType === 'portatil'
                          ? 'bg-sky-400/12 border-sky-400 shadow-[0_0_25px_rgba(56,189,248,0.18)]'
                          : 'bg-[#090D16] border-white/10 hover:border-white/25'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-sky-400/15 border border-sky-400/30 flex items-center justify-center text-sky-400">
                          <Laptop className="w-6 h-6" />
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                            equipmentType === 'portatil'
                              ? 'bg-sky-400 text-slate-950'
                              : 'bg-white/5 text-slate-400'
                          }`}
                        >
                          {equipmentType === 'portatil' ? '✓ SELECCIONADO' : 'ELEGIR'}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-base sm:text-lg font-bold text-white">
                          💻 Portátil Nuevo
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          Portátiles de última generación (Ryzen / Intel Core / Victus / TUF /
                          Lenovo LOQ / VivoBook) sellados y con garantía.
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEquipmentType('pc_gamer');
                        setStep(2);
                      }}
                      className={`text-left p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                        equipmentType === 'pc_gamer'
                          ? 'bg-sky-400/12 border-sky-400 shadow-[0_0_25px_rgba(56,189,248,0.18)]'
                          : 'bg-[#090D16] border-white/10 hover:border-white/25'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-sky-400/15 border border-sky-400/30 flex items-center justify-center text-sky-400">
                          <Monitor className="w-6 h-6" />
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                            equipmentType === 'pc_gamer'
                              ? 'bg-sky-400 text-slate-950'
                              : 'bg-white/5 text-slate-400'
                          }`}
                        >
                          {equipmentType === 'pc_gamer' ? '✓ SELECCIONADO' : 'ELEGIR'}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-base sm:text-lg font-bold text-white">
                          🖥️ Armar PC de Escritorio / Gamer
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          Torre personalizada pieza por pieza con fuentes certificadas, flujo de
                          aire pro y máximo rendimiento por peso invertido.
                        </p>
                      </div>
                    </button>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-6 py-3 rounded-xl bg-white hover:bg-sky-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition flex items-center gap-2 cursor-pointer"
                    >
                      <span>Siguiente: Uso Principal</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: ¿CUÁL SERÁ EL USO PRINCIPAL? */}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-sky-400">
                      PASO 2 DE 4 // PERFIL DE RENDIMIENTO
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                      ¿Cuál será el uso principal?
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Puedes elegir una o varias opciones según lo que vayas a hacer en tu equipo.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {USE_OPTIONS.map((item) => {
                      const Icon = item.icon;
                      const active = selectedUses.includes(item.label);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleUse(item.label)}
                          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                            active
                              ? 'bg-sky-400/12 border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.15)]'
                              : 'bg-[#090D16] border-white/10 hover:border-white/25'
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border ${
                              active
                                ? 'bg-sky-400 text-slate-950 border-sky-300'
                                : 'bg-white/5 text-sky-400 border-white/10'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">
                              {item.label}
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                              {item.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-4 py-3 rounded-xl bg-[#090D16] hover:bg-white/5 text-xs font-mono text-slate-300 border border-white/10 flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Atrás</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="px-6 py-3 rounded-xl bg-white hover:bg-sky-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition flex items-center gap-2 cursor-pointer"
                    >
                      <span>Siguiente: Presupuesto</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: RANGO DE PRESUPUESTO ESTIMADO (COP) */}
              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-sky-400">
                      PASO 3 DE 4 // INVERSIÓN ESTIMADA EN COP
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                      Rango de Presupuesto Estimado
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Buscaremos el máximo rendimiento real dentro de tu rango de presupuesto.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {BUDGET_OPTIONS.map((b) => {
                      const active = budgetRange === b.value;
                      return (
                        <button
                          key={b.value}
                          type="button"
                          onClick={() => {
                            setBudgetRange(b.value);
                            setStep(4);
                          }}
                          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                            active
                              ? 'bg-sky-400/12 border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.15)]'
                              : 'bg-[#090D16] border-white/10 hover:border-white/25'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400">
                              {b.tag}
                            </span>
                            <DollarSign
                              className={`w-4 h-4 ${
                                active ? 'text-sky-400' : 'text-slate-500'
                              }`}
                            />
                          </div>
                          <p className="text-base sm:text-lg font-mono font-bold text-white">
                            {b.value}
                          </p>
                          <p className="text-[11px] text-slate-400 leading-relaxed">{b.desc}</p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-4 py-3 rounded-xl bg-[#090D16] hover:bg-white/5 text-xs font-mono text-slate-300 border border-white/10 flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Atrás</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className="px-6 py-3 rounded-xl bg-white hover:bg-sky-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition flex items-center gap-2 cursor-pointer"
                    >
                      <span>Siguiente: Tus Datos</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: COMENTARIOS ADICIONALES Y DATOS DE CONTACTO */}
              {step === 4 && (
                <form onSubmit={handleSubmitQuote} className="space-y-4">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-sky-400">
                      PASO 4 DE 4 // DETALLES & CONTACTO DIRECTO
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                      Comentarios adicionales y Datos de Contacto
                    </h3>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      ¿Tienes algún juego, programa o característica específica en mente?{' '}
                      <span className="text-slate-500 font-mono">(Opcional)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Ej: 16GB RAM, pantalla 144Hz, Ryzen 5, que corra Warzone fluido o AutoCAD..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#090D16] border border-white/10 focus:border-sky-400 focus:outline-none text-sm text-white placeholder:text-slate-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Tu Nombre <span className="text-sky-400">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          placeholder="Ej: Carlos Andrés"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#090D16] border border-white/10 focus:border-sky-400 focus:outline-none text-sm text-white placeholder:text-slate-500"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-slate-300">
                          WhatsApp (10 dígitos) <span className="text-sky-400">*</span>
                        </label>
                        <span
                          className={`text-[10px] font-mono ${
                            isPhoneValid ? 'text-emerald-400' : 'text-slate-500'
                          }`}
                        >
                          {cleanPhone.length}/10
                        </span>
                      </div>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          inputMode="numeric"
                          required
                          maxLength={10}
                          placeholder="3001234567"
                          value={customerPhone}
                          onChange={(e) =>
                            setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                          }
                          className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#090D16] border border-white/10 focus:border-sky-400 focus:outline-none text-sm font-mono text-white placeholder:text-slate-500"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-slate-300">
                          Ciudad <span className="text-sky-400">*</span>
                        </label>
                        {customerCity.toLowerCase() !== 'ocaña' && (
                          <button
                            type="button"
                            onClick={() => setCustomerCity('Ocaña')}
                            className="text-[10px] font-mono text-sky-400 hover:underline cursor-pointer"
                          >
                            Usar Ocaña
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-sky-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          placeholder="Ocaña / Tu ciudad"
                          value={customerCity}
                          onChange={(e) => setCustomerCity(e.target.value)}
                          className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#090D16] border border-white/10 focus:border-sky-400 focus:outline-none text-sm text-white placeholder:text-slate-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="px-4 py-3 rounded-xl bg-[#090D16] hover:bg-white/5 text-xs font-mono text-slate-300 border border-white/10 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Atrás</span>
                    </button>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-3.5 px-6 rounded-xl bg-sky-400 hover:bg-cyan-300 active:scale-[0.99] text-slate-950 font-bold text-xs sm:text-sm uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_25px_rgba(56,189,248,0.35)] disabled:opacity-50"
                    >
                      <MessageSquare className="w-4 h-4 fill-slate-950" />
                      <span>
                        {submitting
                          ? 'Generando Cotización...'
                          : 'Recibir Opciones Calidad/Precio por WhatsApp'}
                      </span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* RIGHT COLUMN: LIVE SUMMARY CARD */}
            <div className="lg:col-span-4 rounded-3xl bg-[#111827] border border-sky-400/25 p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <span className="text-[11px] font-mono uppercase tracking-widest text-sky-400 font-semibold">
                  RESUMEN DE TU SOLICITUD
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-400/15 text-sky-300 border border-sky-400/30">
                  Paso {step}/4
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-[#090D16] border border-white/[0.06]">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">
                    1. Equipo Buscado
                  </span>
                  <span className="text-sm font-bold text-white mt-0.5 block">
                    {equipmentType === 'portatil'
                      ? '💻 Portátil Nuevo'
                      : '🖥️ Armar PC de Escritorio / Gamer'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#090D16] border border-white/[0.06]">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">
                    2. Uso Principal
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selectedUses.map((u) => (
                      <span
                        key={u}
                        className="px-2 py-0.5 rounded bg-sky-400/10 text-sky-300 border border-sky-400/25 text-[11px] font-mono"
                      >
                        {u.split('(')[0].trim()}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#090D16] border border-white/[0.06]">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">
                    3. Presupuesto Estimado (COP)
                  </span>
                  <span className="text-sm font-mono font-bold text-emerald-400 mt-0.5 block">
                    {budgetRange}
                  </span>
                </div>

                {comments.trim() && (
                  <div className="p-3 rounded-xl bg-[#090D16] border border-white/[0.06]">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">
                      4. Preferencias Específicas
                    </span>
                    <span className="text-xs text-slate-200 mt-0.5 block">{comments}</span>
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-sky-400/10 border border-sky-400/25 text-[11px] text-slate-300 space-y-1 leading-relaxed">
                <p className="font-mono font-bold text-sky-300 uppercase">
                  ¿Cómo funciona Bajo Pedido?
                </p>
                <p>
                  Cotizamos directamente en bodegas mayoristas de Colombia y te enviamos las 2 o 3
                  mejores opciones reales por tu dinero, sin costo ni compromiso.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
