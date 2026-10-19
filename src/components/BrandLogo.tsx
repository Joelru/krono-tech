'use client';

import React from 'react';

interface BrandLogoProps {
  variant?: 'horizontal' | 'stacked' | 'icon-only';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BrandLogo({
  variant = 'horizontal',
  size = 'md',
  className = '',
}: BrandLogoProps) {
  const iconSizes = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9 sm:h-10 sm:w-10',
    lg: 'h-14 w-14',
  };

  const textHeights = {
    sm: 'h-2.5 sm:h-3',
    md: 'h-3 sm:h-3.5',
    lg: 'h-4 sm:h-5',
  };

  if (variant === 'icon-only') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <img
          src="/brand/logo-icon.png"
          alt="Krono Tech"
          width={40}
          height={40}
          className={`${iconSizes[size]} object-contain`}
        />
      </div>
    );
  }

  if (variant === 'stacked') {
    return (
      <div className={`inline-flex flex-col items-center gap-3 ${className}`}>
        <img
          src="/brand/logo-icon.png"
          alt="Krono Tech Icon"
          width={56}
          height={56}
          className={`${iconSizes[size]} object-contain`}
        />
        <img
          src="/brand/logo-text.png"
          alt="KRONO TECH"
          width={180}
          height={20}
          className={`${textHeights[size]} w-auto object-contain`}
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <img
        src="/brand/logo-icon.png"
        alt="Krono Tech"
        width={40}
        height={40}
        className={`${iconSizes[size]} object-contain shrink-0`}
      />

      <span className="h-5 w-[1px] bg-white/15 hidden xs:block" />

      <div className="flex flex-col justify-center">
        <img
          src="/brand/logo-text.png"
          alt="KRONO TECH"
          width={150}
          height={16}
          className={`${textHeights[size]} w-auto object-contain object-left`}
        />
        <span className="text-[9px] font-mono uppercase tracking-[0.22em] text-sky-400/80 mt-0.5 hidden sm:block">
          PRO GAMING GEAR
        </span>
      </div>
    </div>
  );
}
