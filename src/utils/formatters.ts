import type { SyntheticEvent } from 'react';

/**
 * Formats a number to Colombian Peso currency format without decimals: "$ 1.899.900"
 */
export function formatCOP(amount: number): string {
  if (!amount && amount !== 0) return '$ 0';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.round(amount));
}

/**
 * Validates and calculates real discount metadata only when originalPrice > price
 */
export function getValidDiscount(price: number, originalPrice?: number): {
  hasDiscount: boolean;
  originalPrice?: number;
  discountPercentage?: number;
} {
  if (
    typeof originalPrice === 'number' &&
    Number.isFinite(originalPrice) &&
    typeof price === 'number' &&
    Number.isFinite(price) &&
    originalPrice > price
  ) {
    const discountPercentage = Math.round(((originalPrice - price) / originalPrice) * 100);
    if (discountPercentage > 0) {
      return {
        hasDiscount: true,
        originalPrice: Math.round(originalPrice),
        discountPercentage
      };
    }
  }

  return { hasDiscount: false };
}

/**
 * Returns human friendly badge colors for tiers
 */
export function getTierTheme(tierId: 'basic' | 'work' | 'pro') {
  switch (tierId) {
    case 'basic':
      return {
        bgLight: 'bg-sky-50',
        border: 'border-sky-200',
        text: 'text-sky-700',
        badge: 'bg-sky-100 text-sky-800 border-sky-300',
        accent: 'from-sky-500 to-blue-600',
        iconBg: 'bg-sky-100 text-sky-600'
      };
    case 'work':
      return {
        bgLight: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        accent: 'from-emerald-500 to-teal-600',
        iconBg: 'bg-emerald-100 text-emerald-600'
      };
    case 'pro':
      return {
        bgLight: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-700',
        badge: 'bg-purple-100 text-purple-800 border-purple-300',
        accent: 'from-purple-500 to-indigo-600',
        iconBg: 'bg-purple-100 text-purple-600'
      };
  }
}

/**
 * Clean inline SVG fallback image shown if a remote thumbnail fails to load
 */
export const FALLBACK_LAPTOP_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220" fill="none">
      <rect width="320" height="220" rx="16" fill="#F8FAFC"/>
      <rect x="64" y="42" width="192" height="118" rx="10" fill="#E2E8F0" stroke="#94A3B8" stroke-width="4"/>
      <rect x="76" y="54" width="168" height="94" rx="4" fill="#FFFFFF"/>
      <path d="M112 101h96M130 85h60" stroke="#CBD5E1" stroke-width="5" stroke-linecap="round"/>
      <path d="M40 166h240l-12 16H52l-12-16Z" fill="#CBD5E1"/>
      <rect x="136" y="166" width="48" height="5" rx="2.5" fill="#94A3B8"/>
    </svg>`
  );

/**
 * Prevents broken image icons by swapping to a clean local SVG fallback once
 */
export function handleLaptopImageError(event: SyntheticEvent<HTMLImageElement>) {
  const img = event.currentTarget;
  if (img.dataset.fallbackApplied === 'true') return;
  img.dataset.fallbackApplied = 'true';
  img.src = FALLBACK_LAPTOP_IMAGE;
}

/**
 * Ensures image URLs from Mercado Libre always use HTTPS and high-res suffixes
 */
export function getSafeLaptopImageUrl(src?: string): string {
  if (!src || src.includes('img-not-available')) {
    return FALLBACK_LAPTOP_IMAGE;
  }
  return src.replace(/^http:\/\//i, 'https://').replace(/-(?:I|V)\.(jpg|jpeg|webp)$/i, '-O.$1');
}

