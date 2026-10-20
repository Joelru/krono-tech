'use client';

import React, { useState } from 'react';
import {
  HardDrive,
  Cpu,
  Flame,
  Wrench,
  Clock,
  MapPin,
  MessageCircle,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';
import { buildWhatsAppServiceUrl } from '@/lib/format';

interface OptimizationServicesSectionProps {
  whatsappNumber: string;
}

const SERVICES = [
  {
    id: 'ssd',
    title: 'Upgrade de Almacenamiento (SSD NVMe / SATA)',
    description: 'Multiplica por 10 la velocidad de encendido y carga de tus programas.',
    specs: ['NVMe PCIe Gen3 / Gen4', 'SATA III 2.5"', 'Clonación o Instalación Limpia'],
    badge: '10X MÁS VELOZ',
    icon: HardDrive,
  },
  {
    id: 'ram',
    title: 'Ampliación de Memoria RAM (DDR4 / DDR5)',
    description:
      'Elimina los bloqueos al abrir múltiples pestañas, juegos o entornos de desarrollo.',
    specs: ['Dual Channel Activo', '3200MHz / 4800MHz / 5600MHz', 'Portátil (SO-DIMM) & PC'],
    badge: 'MULTITAREA FLUIDA',
    icon: Cpu,
  },
  {
    id: 'termico',
    title: 'Mantenimiento Térmico Pro',
    description:
      'Limpieza interna profunda + cambio de pasta térmica de alto rendimiento para bajar temperaturas y ganar FPS.',
    specs: ['Pasta Térmica Pro Alta Conductividad', 'Desempolvado de Disipadores', 'Cero Thermal Throttling'],
    badge: '-15°C Y MÁS FPS',
    icon: Flame,
  },
];

export function OptimizationServicesSection({
  whatsappNumber,
}: OptimizationServicesSectionProps) {
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const mainCtaUrl = buildWhatsAppServiceUrl(selectedService, whatsappNumber);

  return (
    <section
      id="servicios-ocana"
      className="scroll-mt-28 py-12 sm:py-16 border-t border-white/[0.08] bg-[#0B0F19] relative overflow-hidden"
    >
      {/* Ambient Subtle Glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[200px] bg-sky-500/10 blur-[110px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 relative z-10 space-y-8">
        {/* Header Block */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-400/10 border border-sky-400/30 text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-sky-300 font-semibold">
                <Wrench className="w-3.5 h-3.5 text-sky-400" />
                OPTIMIZACIÓN Y REPOTENCIACIÓN DE EQUIPOS (OCAÑA)
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-[10px] font-mono text-emerald-300">
                <MapPin className="w-3 h-3 text-emerald-400" />
                Exclusivo Clientes en Ocaña
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              ¿Tu portátil está lento o se calienta?{' '}
              <span className="text-sky-400">Lo revivimos.</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Diagnóstico e ingeniería de hardware local en Ocaña. Repotenciamos tu equipo con
              componentes originales para que rinda como nuevo sin gastar en un computador desde
              cero.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-[#111827] border border-white/10 text-xs font-mono text-slate-300 self-start lg:self-auto">
            <Clock className="w-4 h-4 text-sky-400 shrink-0" />
            <span>Atención personalizada en Ocaña después de las 5:00 PM</span>
          </div>
        </div>

        {/* 3 Service Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {SERVICES.map((service) => {
            const Icon = service.icon;
            const isSelected = selectedService === service.title;
            const cardWaUrl = buildWhatsAppServiceUrl(service.title, whatsappNumber);

            return (
              <div
                key={service.id}
                onClick={() =>
                  setSelectedService((prev) => (prev === service.title ? null : service.title))
                }
                className={`group rounded-2xl bg-[#111827] border p-5 sm:p-6 flex flex-col justify-between gap-5 transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'border-sky-400 shadow-[0_14px_34px_-12px_rgba(56,189,248,0.28)] -translate-y-0.5'
                    : 'border-white/[0.08] hover:border-sky-400/45 hover:-translate-y-0.5'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-sky-400/10 border border-sky-400/25 flex items-center justify-center text-sky-400 group-hover:bg-sky-400 group-hover:text-slate-950 transition-colors">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#090D16] text-sky-300 border border-sky-400/30">
                      {service.badge}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-sky-300 transition-colors leading-snug">
                      {service.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      &ldquo;{service.description}&rdquo;
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {service.specs.map((spec, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#090D16] text-slate-300 border border-white/[0.07]"
                      >
                        [{spec}]
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.07] flex items-center justify-between">
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isSelected ? 'Servicio seleccionado' : 'Disponible en Ocaña'}
                  </span>

                  <a
                    href={cardWaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-xs font-mono text-sky-400 hover:text-sky-300 font-semibold"
                  >
                    <span>Cotizar este</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main CTA Bar */}
        <div className="rounded-2xl bg-gradient-to-r from-[#111827] via-[#0F1B2E] to-[#111827] border border-sky-400/30 p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <span className="text-[11px] font-mono uppercase tracking-wider text-sky-400 block">
              SERVICIO TÉCNICO ESPECIALIZADO EN OCAÑA
            </span>
            <p className="text-sm sm:text-base font-bold text-white">
              {selectedService
                ? `Seleccionado: ${selectedService}`
                : '¿No sabes qué necesita tu portátil? Te asesoramos por WhatsApp sin costo.'}
            </p>
          </div>

          <a
            href={mainCtaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full md:w-auto px-6 py-4 rounded-xl bg-sky-400 hover:bg-cyan-300 active:scale-[0.99] text-slate-950 font-bold text-xs sm:text-sm uppercase tracking-wider transition flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(56,189,248,0.35)] shrink-0"
          >
            <MessageCircle className="w-4 h-4 fill-slate-950 shrink-0" />
            <span>
              Agendar Revisión / Cotizar Upgrade por WhatsApp (Atención después de las 5:00 PM)
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
