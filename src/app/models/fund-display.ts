import { environment } from '../../environments/environment';
import type { FundType, FundRiskLevel } from './api.models';

/**
 * Display-layer normalization for investment-fund values.
 *
 * The funds API serializes C# enums as NUMBERS (no JsonStringEnumConverter on
 * the backend), e.g. type 4 = equity, riskLevel 3 = high, sync status 1 =
 * success. The TypeScript models declare string unions, so every consumer
 * must normalize through these helpers instead of comparing raw values.
 */
export type FundSyncStatus = 'success' | 'partial' | 'failed' | 'running';

const FUND_TYPES: FundType[] = [
  'balanced',
  'capital_preservation',
  'commodities',
  'silver',
  'equity',
  'fixed_income',
  'fixed_income_usd',
  'gold',
  'index',
  'money_market',
  'unknown'
];

const FUND_TYPE_BY_NUMBER: Record<number, FundType> = {
  0: 'unknown',
  1: 'balanced',
  2: 'capital_preservation',
  3: 'commodities',
  4: 'equity',
  5: 'fixed_income',
  6: 'fixed_income_usd',
  7: 'gold',
  8: 'index',
  9: 'money_market'
};

const FUND_RISKS: FundRiskLevel[] = ['low', 'medium', 'high', 'unknown'];

const FUND_RISK_BY_NUMBER: Record<number, FundRiskLevel> = {
  0: 'unknown',
  1: 'low',
  2: 'medium',
  3: 'high'
};

/** Maps a backend FundType value (number or string) to the UI string union. */
export function normFundType(v: unknown): FundType {
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    // Legacy alias: SNDUK-era "commodities" is now "silver" everywhere.
    if (s === 'commodities') return 'silver';
    return (FUND_TYPES as string[]).includes(s) ? (s as FundType) : 'unknown';
  }
  if (typeof v === 'number' && Number.isInteger(v)) {
    return FUND_TYPE_BY_NUMBER[v] ?? 'unknown';
  }
  return 'unknown';
}

/** Maps a backend FundRiskLevel value (number or string) to the UI string union. */
export function normFundRiskLevel(v: unknown): FundRiskLevel {
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    return (FUND_RISKS as string[]).includes(s) ? (s as FundRiskLevel) : 'unknown';
  }
  if (typeof v === 'number' && Number.isInteger(v)) {
    return FUND_RISK_BY_NUMBER[v] ?? 'unknown';
  }
  return 'unknown';
}

/**
 * Arabic risk label, or null when the source has no value.
 * Callers hide the field when this returns null instead of showing "غير محدد".
 */
export function fundRiskLabelAr(risk: FundRiskLevel): string | null {
  switch (risk) {
    case 'low': return 'منخفضة';
    case 'medium': return 'متوسطة';
    case 'high': return 'عالية';
    default: return null;
  }
}

/** Arabic fund-type labels for filter options. */
export function fundTypeLabelAr(type: FundType): string {
  switch (type) {
    case 'equity': return 'أسهم (Equity)';
    case 'fixed_income': return 'دخل ثابت (Fixed Income)';
    case 'fixed_income_usd': return 'دخل ثابت بالدولار';
    case 'money_market': return 'سوق نقدي (Money Market)';
    case 'balanced': return 'متوازن (Balanced)';
    case 'index': return 'مؤشر (Index)';
    case 'gold': return 'ذهب (Gold)';
    case 'silver': return 'فضة (Silver)';
    case 'commodities': return 'فضة (Silver)';
    case 'capital_preservation': return 'الحفاظ على رأس المال';
    default: return 'غير محدد';
  }
}

/** Maps a backend FundSyncStatus value (number 0-3 or string) to the UI union. */
export function normFundSyncStatus(v: unknown): FundSyncStatus {
  if (typeof v === 'number' && Number.isInteger(v)) {
    switch (v) {
      case 0: return 'running';
      case 1: return 'success';
      case 2: return 'partial';
      case 3: return 'failed';
      default: return 'failed';
    }
  }
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (s === 'success' || s === 'successful' || s === 'succeeded') return 'success';
    if (s === 'partial' || s === 'partially') return 'partial';
    if (s === 'running' || s === 'inprogress' || s === 'in_progress') return 'running';
    if (s === 'failed' || s === 'failure' || s === 'fail') return 'failed';
    const asNum = Number(s);
    if (Number.isInteger(asNum)) return normFundSyncStatus(asNum);
  }
  return 'failed';
}

/** Arabic sync-status label. */
export function fundSyncStatusLabelAr(status: FundSyncStatus): string {
  switch (status) {
    case 'success': return 'نجح';
    case 'partial': return 'جزئي';
    case 'running': return 'قيد التشغيل';
    default: return 'فشل';
  }
}

/** Status color used across the funds admin UI. */
export function fundSyncStatusColor(status: FundSyncStatus): string {
  switch (status) {
    case 'success': return '#16a34a';
    case 'partial': return '#f59e0b';
    case 'running': return '#2563eb';
    default: return '#dc2626';
  }
}

export type FundSyncDetailStatus = 'success' | 'failed' | 'skipped';

/** Maps a backend FundSyncDetailStatus value (number 0-2 or string). */
export function normFundSyncDetailStatus(v: unknown): FundSyncDetailStatus {
  if (typeof v === 'number' && Number.isInteger(v)) {
    switch (v) {
      case 0: return 'success';
      case 1: return 'failed';
      case 2: return 'skipped';
      default: return 'failed';
    }
  }
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (s === 'success' || s === 'succeeded') return 'success';
    if (s === 'skipped' || s === 'skip') return 'skipped';
    if (s === 'failed' || s === 'failure' || s === 'fail') return 'failed';
    const asNum = Number(s);
    if (Number.isInteger(asNum)) return normFundSyncDetailStatus(asNum);
  }
  return 'failed';
}

/** Arabic per-fund sync status label. */
export function fundSyncDetailStatusLabelAr(status: FundSyncDetailStatus): string {
  switch (status) {
    case 'success': return 'نجح';
    case 'skipped': return 'متخطى';
    default: return 'فشل';
  }
}

/** Arabic label for a category-change-log action (backend CategoryChangeAction enum). */
export function fundCategoryChangeLabelAr(v: unknown): string {
  const labels: Record<number, string> = {
    0: 'إضافة تلقائية',
    1: 'إزالة تلقائية',
    2: 'تضمين يدوي',
    3: 'استبعاد يدوي',
    4: 'إلغاء التضمين',
    5: 'إلغاء الاستبعاد',
    6: 'إعادة للتلقائي',
    7: 'إنشاء تصنيف',
    8: 'إعادة تسمية',
    9: 'حذف تصنيف',
    10: 'استعادة تصنيف',
    11: 'دمج تصنيفات'
  };
  if (typeof v === 'number' && Number.isInteger(v) && labels[v] !== undefined) return labels[v];
  if (typeof v === 'string') {
    const s = v.trim();
    const asNum = Number(s);
    if (Number.isInteger(asNum) && labels[asNum] !== undefined) return labels[asNum];
    const byName = Object.entries(labels).find(([, ar]) => ar === s);
    if (byName) return byName[1];
    if (s) return s;
  }
  return '—';
}

/** Source-clarity label: fund Sharia badges always reflect SNDUK, never Meezan's ruling. */
export const FUND_SOURCE_LABEL = 'تصنيف المصدر (SNDUK)';

/** Tooltip explaining that the Sharia badge is the source classification. */
export const FUND_SHARIA_BADGE_TOOLTIP = 'تصنيف المصدر (SNDUK) — وليس حكم ميزان الشرعي للأسهم';

/** Path prefix the backend serves locally-downloaded fund logos from. */
export const FUND_LOGO_BASE = '/fund-logos';

/**
 * Picks the best available logo for a fund card.
 *
 * Preference order:
 *  1. `localLogoPath` — the copy the backend actually downloaded. Served by the
 *     API host, so it is built as an ABSOLUTE url from the configured API base:
 *     the SPA is served from a different origin (Vercel) in production and in
 *     dev, so a relative "/fund-logos/..." would 404 against the Angular server.
 *  2. `logoUrl` — the original SNDUK/Supabase URL.
 *  3. null — the card falls back to its coloured type icon.
 */
export function fundLogoUrl(localLogoPath: string | null | undefined, logoUrl: string | null | undefined): string | null {
  const remote = (logoUrl ?? '').trim();
  if (remote.length) {
    if (remote.startsWith('//')) return 'https:' + remote;
    return remote;
  }
  const local = (localLogoPath ?? '').trim();
  if (local) {
    if (/^https?:\/\//i.test(local)) return local;
    if (local.startsWith('//')) return 'https:' + local;
    const base = environment.apiBaseUrl.replace(/\/+$/, '');
    return base + FUND_LOGO_BASE + '/' + local.replace(/^\/+/, '').replace(/^funds\//, '');
  }
  return null;
}

/** Arabic label for a fund-type-change-log action (backend FundTypeChangeAction enum). */
export function fundTypeChangeLabelAr(v: unknown): string {
  const labels: Record<number, string> = {
    0: 'إنشاء نوع',
    1: 'إعادة تسمية',
    2: 'حذف نوع',
    3: 'استعادة نوع',
    4: 'دمج أنواع',
    5: 'إعادة ترتيب',
    6: 'تغيير الظهور',
    7: 'تعيين نوع يدوي',
    8: 'إلغاء التعيين اليدوي'
  };
  if (typeof v === 'number' && Number.isInteger(v) && labels[v] !== undefined) return labels[v];
  if (typeof v === 'string') {
    const s = v.trim();
    const asNum = Number(s);
    if (Number.isInteger(asNum) && labels[asNum] !== undefined) return labels[asNum];
    if (s) return s;
  }
  return '—';
}


/**
 * Normalizes an Arabic/English manager name for comparison and URL slug matching:
 *  - trims & collapses spaces
 *  - removes Arabic diacritics (tashkeel) and tatweel
 *  - normalizes alef variants (أ/إ/آ/ٱ → ا), taa marbuta (ة → ه), alef maqsura (ى → ي)
 *  - lowercases ASCII characters
 */
export function normalizeManagerKey(name: string | null | undefined): string {
  if (!name) return '';
  return name
    .trim()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/**
 * Converts a manager name into a URL-safe normalized slug (spaces replaced with '-').
 */
export function normalizeManagerSlug(name: string | null | undefined): string {
  const key = normalizeManagerKey(name);
  if (!key) return '';
  return key.replace(/\s+/g, '-');
}

/**
 * Returns the route parameter for `/fund-managers/:id` given a fund's assetManagerId and assetManagerName.
 * Uses numeric `assetManagerId` when present (> 0), or falls back to `normalizeManagerSlug(assetManagerName)`.
 * Returns `null` when both are empty.
 */
export function managerRouteParam(
  assetManagerId?: number | null,
  assetManagerName?: string | null
): string | null {
  if (typeof assetManagerId === 'number' && Number.isFinite(assetManagerId) && assetManagerId > 0) {
    return String(assetManagerId);
  }
  const slug = normalizeManagerSlug(assetManagerName);
  return slug ? slug : null;
}


/** Single band on the target asset allocation number line. */
export interface FundAllocationBand {
  id: string;
  label: string;
  min: number;
  max: number;
  limitText: string;
  description?: string;
  color: string;
  lane?: number;
}

/** Card item below the number line (both numeric bands and complementary items). */
export interface FundAllocationCardItem {
  id: string;
  label: string;
  limitText: string;
  description?: string;
  color: string;
  hasNumericLimit: boolean;
  min?: number;
  max?: number;
}

export interface FundAllocationModel {
  bands: FundAllocationBand[];
  cards: FundAllocationCardItem[];
  fallbackAllocations: { label: string; pct: number; color: string }[];
  paragraphs: string[];
}

/** Palette for allocation bands & cards */
const ALLOC_COLORS = [
  '#006948', // primary dark green
  '#10b981', // emerald
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#64748b'  // slate
];

/** Normalizes Arabic-Indic numerals (٠-٩) and percentage signs to ASCII. */
function normalizeDigitsAndPct(text: string): string {
  return text
    .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/٪/g, '%');
}

/**
 * Parses target asset allocation bands and descriptive cards safely from
 * fund.descriptionAr and fund.investmentStrategy.
 * Never throws, always produces valid data or a graceful fallback.
 */
export function parseFundAllocations(
  descriptionAr?: string | null,
  investmentStrategy?: string | null,
  fundType?: string | null
): FundAllocationModel {
  const combined = `${descriptionAr || ''}\n${investmentStrategy || ''}`.trim();
  const rawParagraphs = (descriptionAr || investmentStrategy || '')
    .split(/\n\s*\n|\r\n\s*\r\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0 && !p.startsWith('الهيكل الأساسي للاستثمار'));

  if (!combined) {
    return createDefaultAllocation(fundType, rawParagraphs);
  }

  const normalized = normalizeDigitsAndPct(combined);
  const bands: FundAllocationBand[] = [];
  const cards: FundAllocationCardItem[] = [];

  // 1. Look for explicit structured bullet lines like:
  // "≥ 90% من صافي الأصول أسهم مؤشر EGX33 Shariah"
  // "≤ 10% أدوات سيولة واستثمارات متوافقة مع الشريعة"
  const lines = normalized.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Pattern: ≥ or >= or بحد أدنى X%
    const minMatch = line.match(/(?:≥|>=|ما لا يقل عن|بحد أدنى)\s*(\d+(?:\.\d+)?)\s*%/);
    if (minMatch) {
      const val = Math.min(100, Math.max(0, parseFloat(minMatch[1])));
      const label = extractAssetLabel(line, minMatch[0]);
      if (label && isValidAssetClass(label)) {
        const id = 'band_' + bands.length;
        const color = ALLOC_COLORS[bands.length % ALLOC_COLORS.length];
        const limitText = `≥ ${val}% من صافي الأصول`;
        bands.push({
          id,
          label,
          min: val,
          max: 100,
          limitText,
          description: extractAssetNote(label),
          color
        });
        cards.push({
          id,
          label,
          limitText,
          description: extractAssetNote(label),
          color,
          hasNumericLimit: true,
          min: val,
          max: 100
        });
        continue;
      }
    }

    // Pattern: ≤ or <= or حتى or بحد أقصى X%
    const maxMatch = line.match(/(?:≤|<=|حتى|بحد أقصى|ما لا يزيد عن|لا تتجاوز)\s*(\d+(?:\.\d+)?)\s*%/);
    if (maxMatch) {
      const val = Math.min(100, Math.max(0, parseFloat(maxMatch[1])));
      // Ignore company/concentration regulatory caps (e.g. "في شركة واحدة 15%", "في صندوق آخر 20%")
      if (!isSingleCompanyCap(line)) {
        const label = extractAssetLabel(line, maxMatch[0]);
        if (label && isValidAssetClass(label)) {
          const id = 'band_' + bands.length;
          const color = ALLOC_COLORS[bands.length % ALLOC_COLORS.length];
          const limitText = `≤ ${val}% من صافي الأصول`;
          bands.push({
            id,
            label,
            min: 0,
            max: val,
            limitText,
            description: extractAssetNote(label),
            color
          });
          cards.push({
            id,
            label,
            limitText,
            description: extractAssetNote(label),
            color,
            hasNumericLimit: true,
            min: 0,
            max: val
          });
          continue;
        }
      }
    }

    // Pattern: بين X% و Y%
    const rangeMatch = line.match(/(?:بين|تتراوح بين|من)\s*(\d+(?:\.\d+)?)\s*%\s*(?:و|إلى|-)\s*(\d+(?:\.\d+)?)\s*%/);
    if (rangeMatch) {
      const v1 = Math.min(100, Math.max(0, parseFloat(rangeMatch[1])));
      const v2 = Math.min(100, Math.max(0, parseFloat(rangeMatch[2])));
      const minVal = Math.min(v1, v2);
      const maxVal = Math.max(v1, v2);
      const label = extractAssetLabel(line, rangeMatch[0]);
      if (label && isValidAssetClass(label)) {
        const id = 'band_' + bands.length;
        const color = ALLOC_COLORS[bands.length % ALLOC_COLORS.length];
        const limitText = `${minVal}% - ${maxVal}% من صافي الأصول`;
        bands.push({
          id,
          label,
          min: minVal,
          max: maxVal,
          limitText,
          description: extractAssetNote(label),
          color
        });
        cards.push({
          id,
          label,
          limitText,
          description: extractAssetNote(label),
          color,
          hasNumericLimit: true,
          min: minVal,
          max: maxVal
        });
        continue;
      }
    }

    // Pattern: Non-numeric complementary item, e.g. "تشمل الاستثمارات المكملة : الحسابات الجارية والودائع البنكية"
    if (line.includes('استثمارات مكملة') || line.includes('الاستثمارات المكملة') || line.includes('الودائع البنكية') || line.includes('الحسابات الجارية')) {
      if (!cards.some(c => c.label.includes('مكملة') || c.label.includes('ودائع'))) {
        cards.push({
          id: 'card_comp_' + cards.length,
          label: 'استثمارات مكملة',
          limitText: 'حسابات وودائع بنكية',
          description: 'حسابات جارية وودائع بالبنوك الإسلامية وأدوات نقدية مكملة',
          color: '#64748b',
          hasNumericLimit: false
        });
      }
    }
  }

  // 2. If no bands were found line-by-line, run regex search across the full prose text
  if (bands.length === 0) {
    // Check range: بين 40% و 95%
    const proseRange = /(?:بين|تتراوح بين)\s*(\d+(?:\.\d+)?)\s*%\s*(?:و|إلى)\s*(\d+(?:\.\d+)?)\s*%\s*(?:من صافي الأصول)?\s*(?:إلى|في)?\s*([^.,؛\n]{4,40})/g;
    let m: RegExpExecArray | null;
    while ((m = proseRange.exec(normalized)) !== null) {
      const v1 = parseFloat(m[1]);
      const v2 = parseFloat(m[2]);
      const rawLbl = cleanProseLabel(m[3]);
      if (isValidAssetClass(rawLbl)) {
        const id = 'band_' + bands.length;
        const color = ALLOC_COLORS[bands.length % ALLOC_COLORS.length];
        const minVal = Math.min(v1, v2);
        const maxVal = Math.max(v1, v2);
        const limitText = `${minVal}% - ${maxVal}% من صافي الأصول`;
        bands.push({
          id,
          label: rawLbl,
          min: minVal,
          max: maxVal,
          limitText,
          description: extractAssetNote(rawLbl),
          color
        });
        cards.push({
          id,
          label: rawLbl,
          limitText,
          description: extractAssetNote(rawLbl),
          color,
          hasNumericLimit: true,
          min: minVal,
          max: maxVal
        });
      }
    }

    // Check min: ما لا يقل عن 80% ...
    const proseMin = /(?:ما لا يقل عن|بحد أدنى)\s*(\d+(?:\.\d+)?)\s*%\s*(?:من صافي الأصول)?\s*(?:في|إلى)?\s*([^.,؛\n]{4,40})/g;
    while ((m = proseMin.exec(normalized)) !== null) {
      const v = parseFloat(m[1]);
      const rawLbl = cleanProseLabel(m[2]);
      if (isValidAssetClass(rawLbl) && !bands.some(b => b.label === rawLbl)) {
        const id = 'band_' + bands.length;
        const color = ALLOC_COLORS[bands.length % ALLOC_COLORS.length];
        const limitText = `≥ ${v}% من صافي الأصول`;
        bands.push({
          id,
          label: rawLbl,
          min: v,
          max: 100,
          limitText,
          description: extractAssetNote(rawLbl),
          color
        });
        cards.push({
          id,
          label: rawLbl,
          limitText,
          description: extractAssetNote(rawLbl),
          color,
          hasNumericLimit: true,
          min: v,
          max: 100
        });
      }
    }

    // Check max: حتى 20% كحد أقصى ... أو ما يصل إلى 20%
    const proseMax = /(?:حتى|ما يصل إلى|بحد أقصى|تصل إلى نحو)\s*(\d+(?:\.\d+)?)\s*%\s*(?:كحد أقصى)?\s*(?:من الأصول|من صافي الأصول)?\s*(?:في|لأدوات|لـ)?\s*([^.,؛\n]{4,40})/g;
    while ((m = proseMax.exec(normalized)) !== null) {
      const v = parseFloat(m[1]);
      const rawLbl = cleanProseLabel(m[2]);
      if (isValidAssetClass(rawLbl) && !bands.some(b => b.label === rawLbl)) {
        const id = 'band_' + bands.length;
        const color = ALLOC_COLORS[bands.length % ALLOC_COLORS.length];
        const limitText = `≤ ${v}% من صافي الأصول`;
        bands.push({
          id,
          label: rawLbl,
          min: 0,
          max: v,
          limitText,
          description: extractAssetNote(rawLbl),
          color
        });
        cards.push({
          id,
          label: rawLbl,
          limitText,
          description: extractAssetNote(rawLbl),
          color,
          hasNumericLimit: true,
          min: 0,
          max: v
        });
      }
    }
  }

  // If still no numeric bands, generate default based on fund type
  if (bands.length === 0) {
    return createDefaultAllocation(fundType, rawParagraphs);
  }

  // If there are numeric bands but no complementary card, add one if mentioned in text
  if (!cards.some(c => !c.hasNumericLimit)) {
    if (normalized.includes('سيولة') || normalized.includes('ودائع') || normalized.includes('مكملة')) {
      cards.push({
        id: 'card_comp_def',
        label: 'استثمارات مكملة',
        limitText: 'حسابات وودائع بنكية',
        description: 'حسابات جارية وودائع مصرفية لدعم السيولة وإدارة المخاطر',
        color: '#64748b',
        hasNumericLimit: false
      });
    }
  }

  // Assign distinct display lanes so overlapping bands don't collide visually
  assignLanes(bands);

  // Fallback 2-color / N-color bar items
  const fallbackAllocations = bands.map(b => ({
    label: b.label,
    pct: b.min > 0 ? b.min : b.max,
    color: b.color
  }));

  return {
    bands,
    cards,
    fallbackAllocations,
    paragraphs: rawParagraphs.slice(0, 3)
  };
}

/** Assigns staggered horizontal lanes (0, 1, 2) when bands overlap on the 0-100 scale. */
function assignLanes(bands: FundAllocationBand[]): void {
  for (let i = 0; i < bands.length; i++) {
    const cur = bands[i];
    let lane = 0;
    for (let j = 0; j < i; j++) {
      const prev = bands[j];
      // If ranges overlap: [cur.min, cur.max] and [prev.min, prev.max]
      const overlap = Math.max(cur.min, prev.min) < Math.min(cur.max, prev.max);
      if (overlap && prev.lane === lane) {
        lane++;
      }
    }
    cur.lane = lane;
  }
}

function isSingleCompanyCap(line: string): boolean {
  return /شركة واحدة|أطراف مرتبطة|مجموعة مالية|صندوق آخر|أرباح قابلة|معامل ارتباط/.test(line);
}

function isValidAssetClass(label: string): boolean {
  if (!label || label.length < 3) return false;
  return /أسهم|سندات|صكوك|سيولة|دخل ثابت|أذون|نقدية|ودائع|صناديق|معادن|ذهب/.test(label);
}

function extractAssetLabel(line: string, matchPart: string): string {
  let rest = line.replace(matchPart, '').trim();
  rest = rest.replace(/^(?:من صافي الأصول|من الأصول|في|إلى|كحد أقصى|كحد أدنى)\s*/, '').trim();
  rest = rest.replace(/^(?:أسهم شركات تعمل في مجالات مثل|أسهم شركات|أدوات أكثر|أدوات|صورة)\s*/, '').trim();
  const parts = rest.split(/[-–—:]/);
  let candidate = parts[0].trim();
  if (candidate.length > 35) candidate = candidate.slice(0, 35);
  return cleanProseLabel(candidate);
}

function cleanProseLabel(s: string): string {
  return s
    .replace(/^[\s,؛.\-–—]+|[\s,؛.\-–—]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractAssetNote(label: string): string {
  if (label.includes('EGX33')) return 'موزعة على أكبر 33 شركة متوافقة مع الشريعة في البورصة المصرية';
  if (label.includes('أسهم')) return 'محفظة أسهم مقيدة بالبورصة متوافقة مع الضوابط الاستثمارية';
  if (label.includes('سيولة') || label.includes('صكوك')) return 'أدوات سيولة واستثمارات متوافقة مع ضوابط الشريعة';
  if (label.includes('دخل ثابت') || label.includes('سندات')) return 'أدوات دين وأذون خزانة لتعزيز استقرار العائد';
  if (label.includes('عقار')) return 'شركات التطوير العقاري والمقاولات ومواد البناء';
  return 'استثمارات مخصصة لدعم هيكل المحفظة الاستثمارية';
}

function createDefaultAllocation(fundType?: string | null, rawParagraphs: string[] = []): FundAllocationModel {
  const normType = normFundType(fundType);
  let bands: FundAllocationBand[] = [];
  let cards: FundAllocationCardItem[] = [];

  if (normType === 'money_market' || normType === 'fixed_income') {
    bands = [
      { id: 'b1', label: 'أدوات الدخل الثابت والأذون', min: 70, max: 100, limitText: '≥ 70% من صافي الأصول', description: 'أذون وسندات خزانة وأدوات نقدية قصيرة الأجل', color: '#006948', lane: 0 },
      { id: 'b2', label: 'ودائع وسيولة نقدية', min: 0, max: 30, limitText: '≤ 30% سيولة', description: 'حسابات بنكية وودائع مصرفية لدعم السيولة اليومية', color: '#10b981', lane: 1 }
    ];
    cards = [
      { id: 'b1', label: 'أدوات الدخل الثابت والأذون', limitText: '≥ 70% من صافي الأصول', description: 'أذون وسندات خزانة وأدوات نقدية قصيرة الأجل', color: '#006948', hasNumericLimit: true, min: 70, max: 100 },
      { id: 'b2', label: 'ودائع وسيولة نقدية', limitText: '≤ 30% سيولة', description: 'حسابات بنكية وودائع مصرفية لدعم السيولة اليومية', color: '#10b981', hasNumericLimit: true, min: 0, max: 30 },
      { id: 'c3', label: 'استثمارات مكملة', limitText: 'حسابات وودائع بنكية', description: 'حسابات جارية وودائع مصرفية لدعم السيولة', color: '#64748b', hasNumericLimit: false }
    ];
  } else if (normType === 'balanced') {
    bands = [
      { id: 'b1', label: 'أسهم مقيدة بالبورصة', min: 30, max: 70, limitText: '30% - 70% من صافي الأصول', description: 'محفظة أسهم مدرجة بالبورصة المصرية', color: '#006948', lane: 0 },
      { id: 'b2', label: 'أدوات دخل ثابت وسيولة', min: 30, max: 70, limitText: '30% - 70% من صافي الأصول', description: 'أدوات دين وسندات وودائع بنكية', color: '#10b981', lane: 1 }
    ];
    cards = [
      { id: 'b1', label: 'أسهم مقيدة بالبورصة', limitText: '30% - 70% من صافي الأصول', description: 'محفظة أسهم مدرجة بالبورصة المصرية', color: '#006948', hasNumericLimit: true, min: 30, max: 70 },
      { id: 'b2', label: 'أدوات دخل ثابت وسيولة', limitText: '30% - 70% من صافي الأصول', description: 'أدوات دين وسندات وودائع بنكية', color: '#10b981', hasNumericLimit: true, min: 30, max: 70 },
      { id: 'c3', label: 'استثمارات مكملة', limitText: 'حسابات وودائع بنكية', description: 'أدوات نقدية قصيرة الأجل لإدارة المخاطر', color: '#64748b', hasNumericLimit: false }
    ];
  } else {
    // Default equity
    bands = [
      { id: 'b1', label: 'أسهم الشركات المقيدة', min: 80, max: 100, limitText: '≥ 80% من صافي الأصول', description: 'أسهم الشركات المدرجة بالبورصة المصرية وفق السياسة المعتمدة', color: '#006948', lane: 0 },
      { id: 'b2', label: 'أدوات سيولة واستثمارات سائلة', min: 0, max: 20, limitText: '≤ 20% أدوات سيولة', description: 'استثمارات سائلة وودائع متوافقة مع الضوابط', color: '#10b981', lane: 1 }
    ];
    cards = [
      { id: 'b1', label: 'أسهم الشركات المقيدة', limitText: '≥ 80% من صافي الأصول', description: 'أسهم الشركات المدرجة بالبورصة المصرية وفق السياسة المعتمدة', color: '#006948', hasNumericLimit: true, min: 80, max: 100 },
      { id: 'b2', label: 'أدوات سيولة واستثمارات سائلة', limitText: '≤ 20% أدوات سيولة', description: 'استثمارات سائلة وودائع متوافقة مع الضوابط', color: '#10b981', hasNumericLimit: true, min: 0, max: 20 },
      { id: 'c3', label: 'استثمارات مكملة', limitText: 'حسابات وودائع بنكية', description: 'حسابات جارية وودائع بالبنوك الإسلامية وأدوات نقدية', color: '#64748b', hasNumericLimit: false }
    ];
  }

  const fallbackAllocations = bands.map(b => ({
    label: b.label,
    pct: b.min > 0 ? b.min : b.max,
    color: b.color
  }));

  return {
    bands,
    cards,
    fallbackAllocations,
    paragraphs: rawParagraphs.slice(0, 3)
  };
}
