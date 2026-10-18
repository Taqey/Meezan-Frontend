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
  const local = (localLogoPath ?? '').trim();
  if (local) {
    // Guard against a malformed DB value ever turning into a protocol-relative URL.
    if (/^https?:\/\//i.test(local)) return local;
    if (local.startsWith('//')) return 'https:' + local;
    const base = environment.apiBaseUrl.replace(/\/+$/, '');
    return base + FUND_LOGO_BASE + '/' + local.replace(/^\/+/, '').replace(/^funds\//, '');
  }
  const remote = (logoUrl ?? '').trim();
  return remote.length ? remote : null;
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
