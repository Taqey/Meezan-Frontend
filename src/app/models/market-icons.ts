import {
  BarChart3,
  BrickWall,
  Building2,
  ChartPie,
  Coins,
  Cpu,
  Factory,
  GraduationCap,
  HardHat,
  Landmark,
  Layers,
  Moon,
  Mountain,
  Plane,
  Rocket,
  Shield,
  ShieldCheck,
  Ship,
  Shirt,
  Stethoscope,
  Store,
  Tag,
  TrendingUp,
  Trophy,
  Utensils,
  Wallet,
  Zap,
  type LucideIconData
} from 'lucide-angular';

/**
 * Single config for market icons (index cards + sector cards).
 * Keys are NORMALIZED codes/names — never raw display text — with a generic
 * fallback for any index/sector added later. Icon containers, sizes and
 * colors are untouched (icons inherit currentColor, so light/dark and RTL
 * keep working as before).
 */

/** Normalized index code: uppercase, spaces/underscores removed ('EGX 33' → 'EGX33'). */
function normalizeIndexCode(code?: string | null): string {
  return (code || '').toUpperCase().replace(/[\s_]+/g, '');
}

const INDEX_ICONS: Record<string, LucideIconData> = {
  'EGX30': Trophy,
  'EGX100': Layers,
  'EGX33': Moon,
  'SHARIAH': Moon, // legacy alias for the Shariah index
  'EGX70': TrendingUp,
  'EGX35-LV': Shield,
  'EGX30TR': Coins,
  'TAMAYUZ': Rocket,
  'SECTORAL-INDICES': ChartPie
};

/**
 * Standard short code map for indices across cards, badges, and filters.
 * Returns concise code (EGX30, EGX70, EGX100, EGX35-LV, EGX33, EGX30TR, Tamayuz).
 * Sectoral-Indices keeps its label 'المؤشرات القطاعية'.
 */
const INDEX_SHORT_NAMES: Record<string, string> = {
  'EGX30': 'EGX30',
  'EGX70': 'EGX70',
  'EGX100': 'EGX100',
  'EGX35-LV': 'EGX35-LV',
  'EGX35LV': 'EGX35-LV',
  'EGX33': 'EGX33',
  'SHARIAH': 'EGX33',
  'EGX30TR': 'EGX30TR',
  'TAMAYUZ': 'Tamayuz',
  'SECTORAL-INDICES': 'المؤشرات القطاعية'
};

const INDEX_FULL_NAMES: Record<string, { ar: string; en: string }> = {
  'EGX30': { ar: 'المؤشر الرئيسي للبورصة المصرية EGX30', en: 'EGX 30 Index' },
  'EGX70': { ar: 'مؤشر الشركات الصغيرة والمتوسطة EGX70 EWI', en: 'EGX 70 Equal Weights Index' },
  'EGX100': { ar: 'المؤشر الأوسع نطاقاً EGX100 EWI', en: 'EGX 100 Equal Weights Index' },
  'EGX35-LV': { ar: 'مؤشر التذبذب المنخفض EGX35-LV', en: 'EGX 35 Low Volatility Index' },
  'EGX35LV': { ar: 'مؤشر التذبذب المنخفض EGX35-LV', en: 'EGX 35 Low Volatility Index' },
  'EGX33': { ar: 'مؤشر الشريعة الإسلامية EGX33', en: 'EGX 33 Shariah Index' },
  'SHARIAH': { ar: 'مؤشر الشريعة الإسلامية EGX33', en: 'EGX 33 Shariah Index' },
  'EGX30TR': { ar: 'مؤشر العائد الكلي EGX30TR', en: 'EGX 30 Total Return Index' },
  'TAMAYUZ': { ar: 'مؤشر الشركات الصغيرة والمتوسطة تميز', en: 'Tamayuz Index' },
  'SECTORAL-INDICES': { ar: 'المؤشرات القطاعية', en: 'Sectoral Indices' }
};

export function indexShortNameFor(code?: string | null): string {
  if (!code) return '';
  const norm = normalizeIndexCode(code);
  return INDEX_SHORT_NAMES[norm] ?? code;
}

export function indexFullNameFor(code?: string | null): { ar: string; en: string } {
  const norm = normalizeIndexCode(code);
  return INDEX_FULL_NAMES[norm] ?? { ar: code || '', en: code || '' };
}

/** Normalized codes of featured indices (green border + official ribbon). */
const FEATURED_INDEX_CODES = ['EGX33', 'SHARIAH'];

/** True for the official Sharia index card(s). */
export function isFeaturedIndex(code?: string | null): boolean {
  return FEATURED_INDEX_CODES.includes(normalizeIndexCode(code));
}

export interface IndexAccent {
  accent: string;
  tint: string;
  ink: string;
}

const DEFAULT_INDEX_ACCENT: IndexAccent = {
  accent: '#087f5b',
  tint: '#e4f4ed',
  ink: '#087f5b'
};

const INDEX_ACCENTS: Record<string, IndexAccent> = {
  'EGX30': { accent: '#b45309', tint: '#fdf1e0', ink: '#92400e' },
  'EGX100': { accent: '#4f46e5', tint: '#eceafd', ink: '#4338ca' },
  'EGX33': { accent: '#087f5b', tint: '#e4f4ed', ink: '#087f5b' },
  'SHARIAH': { accent: '#087f5b', tint: '#e4f4ed', ink: '#087f5b' },
  'EGX70': { accent: '#0f766e', tint: '#e2f3f0', ink: '#0f766e' },
  'EGX35-LV': { accent: '#0284c7', tint: '#e2f2fc', ink: '#0369a1' },
  'EGX30TR': { accent: '#ca8a04', tint: '#fdf6e0', ink: '#a16207' },
  'TAMAYUZ': { accent: '#db2777', tint: '#fce8f2', ink: '#be185d' },
  'SECTORAL-INDICES': { accent: '#7c3aed', tint: '#ede8fd', ink: '#6d28d9' }
};

/** Accent triple for an index card; falls back to the brand green. */
export function indexAccentFor(code?: string | null): IndexAccent {
  return INDEX_ACCENTS[normalizeIndexCode(code)] ?? DEFAULT_INDEX_ACCENT;
}

/** Icon for an index card; falls back to the generic bar-chart icon. */
export function indexIconFor(code?: string | null): LucideIconData {
  return INDEX_ICONS[normalizeIndexCode(code)] ?? BarChart3;
}

/**
 * Per-index card behavior, keyed by normalized code. `showAggregates: false`
 * marks an umbrella entry whose members are already covered one level down
 * (Sectoral-Indices → the 16 sectors): no performance/compliance is
 * calculated or shown for it anywhere (cards, table, heatmap, KPIs, sorts).
 */
const INDEX_CARD_CONFIG: Record<string, { showAggregates: boolean }> = {
  'SECTORAL-INDICES': { showAggregates: false }
};

/** False only for umbrella entries like Sectoral-Indices (default true). */
export function indexShowsAggregates(code?: string | null): boolean {
  return INDEX_CARD_CONFIG[normalizeIndexCode(code)]?.showAggregates ?? true;
}

const ARABIC_SECTOR_KEYS: Record<string, string> = {
  'عقارات': 'realestate',
  'خدمات مالية غير مصرفية': 'non-bankfinancialservices',
  'أغذية و مشروبات و تبغ': 'foodbeveragesandtobacco',
  'أغذية ومشروبات وتبغ': 'foodbeveragesandtobacco',
  'رعاية صحية و ادوية': 'healthcare&pharmaceuticals',
  'رعاية صحية وأدوية': 'healthcare&pharmaceuticals',
  'موارد أساسية': 'basicresources',
  'بنوك': 'banks',
  'مقاولات و إنشاءات هندسية': 'contracting&constructionengineering',
  'مقاولات وإنشاءات هندسية': 'contracting&constructionengineering',
  'مواد البناء': 'buildingmaterials',
  'سياحة وترفيه': 'travel&leisure',
  'اتصالات و  اعلام و تكنولوجيا المعلومات': 'itmedia&communicationservices',
  'اتصالات وإعلام وتكنولوجيا المعلومات': 'itmedia&communicationservices',
  'منسوجات و سلع معمرة': 'textile&durables',
  'منسوجات وسلع معمرة': 'textile&durables',
  'خدمات و منتجات صناعية وسيارات': 'industrialgoodsservicesandautomobiles',
  'خدمات ومنتجات صناعية وسيارات': 'industrialgoodsservicesandautomobiles',
  'خدمات تعليمية': 'educationservices',
  'تجارة و موزعون': 'trade&distributors',
  'تجارة وموزعون': 'trade&distributors',
  'طاقة وخدمات مساندة': 'energy&supportservices',
  'طاقة و خدمات مساندة': 'energy&supportservices',
  'خدمات النقل والشحن': 'shipping&transportationservices',
  'ورق ومواد تعبئة و تغليف': 'paper&packaging',
  'ورق ومواد تعبئة وتغليف': 'paper&packaging',
  'مرافق': 'utilities'
};

/**
 * Normalized sector key: lowercase STABLE English name or Arabic sector text,
 * spaces/commas collapsed ('IT , Media & Communication Services' → 'itmedia&communicationservices').
 */
function normalizeSectorKey(name?: string | null): string {
  if (!name) return '';
  const trimmed = name.trim();
  if (ARABIC_SECTOR_KEYS[trimmed]) {
    return ARABIC_SECTOR_KEYS[trimmed];
  }
  // Try clean Arabic normalization (remove extra spaces and Alef hamzas)
  const cleanAr = trimmed.replace(/\s+/g, ' ').replace(/[إأآ]/g, 'ا');
  for (const [arKey, enKey] of Object.entries(ARABIC_SECTOR_KEYS)) {
    if (arKey.replace(/\s+/g, ' ').replace(/[إأآ]/g, 'ا') === cleanAr) {
      return enKey;
    }
  }
  return trimmed.toLowerCase().replace(/[\s,]+/g, '');
}

const SECTOR_ICONS: Record<string, LucideIconData> = {
  'realestate': Building2,
  'non-bankfinancialservices': Wallet,
  'foodbeveragesandtobacco': Utensils,
  'healthcare&pharmaceuticals': Stethoscope,
  'basicresources': Mountain,
  'banks': Landmark,
  'buildingmaterials': BrickWall,
  'contracting&constructionengineering': HardHat,
  'textile&durables': Shirt,
  'itmedia&communicationservices': Cpu,
  'industrialgoodsservicesandautomobiles': Factory,
  'trade&distributors': Store,
  'travel&leisure': Plane,
  'educationservices': GraduationCap,
  'energy&supportservices': Zap,
  'shipping&transportationservices': Ship,
  'utilities': Zap,
  'paper&packaging': Layers
};

/** Icon for a sector card; falls back to the generic tag icon. */
export function sectorIconFor(name?: string | null): LucideIconData {
  return SECTOR_ICONS[normalizeSectorKey(name)] ?? Tag;
}

export interface SectorAccent {
  /** Card top border + strong accents. */
  accent: string;
  /** Soft tinted backgrounds (icon box, pills). */
  tint: string;
  /** Text/icons on top of the tint. */
  ink: string;
}

const DEFAULT_SECTOR_ACCENT: SectorAccent = {
  accent: '#64748b',
  tint: '#f1f5f9',
  ink: '#334155'
};

const SECTOR_ACCENTS: Record<string, SectorAccent> = {
  'realestate': { accent: '#2563eb', tint: '#e8effd', ink: '#1d4ed8' },
  'non-bankfinancialservices': { accent: '#4f46e5', tint: '#eceafd', ink: '#4338ca' },
  'foodbeveragesandtobacco': { accent: '#15803d', tint: '#e7f4ea', ink: '#166534' },
  'healthcare&pharmaceuticals': { accent: '#e11d48', tint: '#fde9ed', ink: '#be123c' },
  'basicresources': { accent: '#b45309', tint: '#fdf1e0', ink: '#92400e' },
  'banks': { accent: '#0f766e', tint: '#e2f3f0', ink: '#0f766e' },
  'buildingmaterials': { accent: '#ea580c', tint: '#fdeee2', ink: '#c2410c' },
  'contracting&constructionengineering': { accent: '#0891b2', tint: '#e3f4f9', ink: '#0e7490' },
  'textile&durables': { accent: '#9333ea', tint: '#f1e7fd', ink: '#7e22ce' },
  'itmedia&communicationservices': { accent: '#0284c7', tint: '#e2f2fc', ink: '#0369a1' },
  'industrialgoodsservicesandautomobiles': { accent: '#475569', tint: '#eceff3', ink: '#334155' },
  'trade&distributors': { accent: '#65a30d', tint: '#eff6e3', ink: '#4d7c0f' },
  'travel&leisure': { accent: '#db2777', tint: '#fce8f2', ink: '#be185d' },
  'educationservices': { accent: '#ca8a04', tint: '#fdf6e0', ink: '#a16207' },
  'energy&supportservices': { accent: '#dc2626', tint: '#fdeaea', ink: '#b91c1c' },
  'shipping&transportationservices': { accent: '#0d9488', tint: '#e0f4f2', ink: '#0f766e' },
  'utilities': { accent: '#0284c7', tint: '#e0f2fe', ink: '#0369a1' },
  'paper&packaging': { accent: '#ca8a04', tint: '#fef9c3', ink: '#a16207' }
};

/** Accent triple for a sector card or badge; falls back to a neutral gray badge. */
export function sectorAccentFor(name?: string | null): SectorAccent {
  return SECTOR_ACCENTS[normalizeSectorKey(name)] ?? DEFAULT_SECTOR_ACCENT;
}
