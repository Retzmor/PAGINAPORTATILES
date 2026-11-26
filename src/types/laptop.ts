export type UsageTierId = 'basic' | 'work' | 'pro';

export interface UsageTier {
  id: UsageTierId;
  label: 'Estudio y Oficina Básica' | 'Multitarea y Trabajo Fluido' | 'Alto Rendimiento / Gaming / Diseño';
  icon: string;
  shortDescription: string;
  badgeBg: string;
  badgeText: string;
  recommendedFor: string[];
  idealUser: string;
}

export interface ProcessorInfo {
  raw: string;
  family: string;
  tierScore: number; // 1 a 5 para comparador
  humanDescription: string;
}

export interface RamInfo {
  sizeGB: number;
  label: string;
  explanation: string;
}

export interface StorageInfo {
  sizeGB: number;
  type: 'SSD' | 'HDD' | 'eMMC' | 'SSD + HDD';
  label: string;
  explanation: string;
}

export interface Laptop {
  id: string;
  nombre?: string;
  title: string;
  precioCOP?: number;
  precioCOPFormateado?: string;
  price: number;
  enlace?: string;
  permalink?: string;
  url: string;
  imagen?: string;
  imageUrl: string;
  affiliateUrl?: string;
  originalPrice?: number;
  discountPercentage?: number;
  brand: string;
  processor: ProcessorInfo;
  ram: RamInfo;
  storage: StorageInfo;
  tier: UsageTier;
  condition: 'Nuevo' | 'Reacondicionado';
  freeShipping: boolean;
  installments?: string; // e.g. "Hasta 12 cuotas sin interés"
  rating?: number;
  reviewsCount?: number;
  seller?: string;
  screenSize?: string;
  updatedAt: string;
  priceSyncedAt?: string;
}

export interface FilterState {
  searchQuery: string;
  tier: UsageTierId | 'all';
  budgetRange: 'all' | 'under-2m' | '2m-3.2m' | 'over-3.2m';
  customMaxPrice: number;
  brands: string[];
  minRam: number;
  onlyFreeShipping: boolean;
  onlyOfficialStores: boolean;
  sortBy: 'relevance' | 'price-asc' | 'price-desc' | 'ram-desc' | 'value';
}

