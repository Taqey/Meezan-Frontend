/**
 * Single structured source for purification (التطهير) calculation approaches.
 * The comparison table, the approach accordion and the calculator all render
 * from this file — no approach facts are duplicated in components.
 */

export type PurificationApproachId = 'ownership' | 'received-profits' | 'dividends-only';

export interface PurificationApproach {
  id: PurificationApproachId;
  titleAr: string;
  bodies: string[];
  includesDividends: boolean;
  includesCapitalGain: boolean;
  formulaAr: string;
  summaryAr: string;
}

export const PURIFICATION_APPROACHES: readonly PurificationApproach[] = [
  {
    id: 'ownership',
    titleAr: 'حسب ملكية السهم',
    bodies: ['أيوفي (AAOIFI)'],
    includesDividends: false,
    includesCapitalGain: false,
    formulaAr: 'نصيب سهمك من الدخل المحظور في اليوم × عدد أيام الحيازة × عدد الأسهم',
    summaryAr: 'يربط التطهير بمدة احتفاظك بالسهم نفسه، سواء ربحت أو خسرت، ويحتاج بيانات يومية لكل سهم لذلك لا تشمله الحاسبة هنا.'
  },
  {
    id: 'received-profits',
    titleAr: 'حسب الأرباح المستلمة',
    bodies: ['إس آند بي (S&P)', 'بورصة حلال'],
    includesDividends: true,
    includesCapitalGain: true,
    formulaAr: 'نسبة التطهير × (التوزيعات + الربح الرأسمالي)',
    summaryAr: 'لا يُطهَّر إلا ما قبضته فعلاً: التوزيعات النقدية مع أي ربح تحقق عند البيع. بورصة حلال تتيح هذا الخيار إلى جانب خيار الملكية.'
  },
  {
    id: 'dividends-only',
    titleAr: 'على التوزيعات فقط أو بنسبة جاهزة',
    bodies: ['مصفّى'],
    includesDividends: true,
    includesCapitalGain: false,
    formulaAr: 'النسبة الجاهزة × التوزيعات',
    summaryAr: 'مصفّى يعرض نسبة جاهزة تُطبَّق على التوزيعات.'
  }
];

/** Faisal Islamic Bank board row: shown as a sub-row under dividends-only. */
export const FAISAL_SUB_ROW: {
  titleAr: string;
  bodies: string[];
  includesDividends: boolean;
  includesCapitalGain: boolean;
  summaryAr: string;
} = {
  titleAr: 'لجنة بنك فيصل',
  bodies: ['بنك فيصل الإسلامي'],
  includesDividends: true,
  includesCapitalGain: true,
  summaryAr: 'لجنة بنك فيصل تأخذ بالأحوط فتُدخل الربح الرأسمالي أيضاً بالنسب التي يقررها مجلسها.'
};

export type CalculatorApproach = 'received-profits' | 'dividends-only';

function sanitizeAmount(value: number | null | undefined): number {
  const n = value == null ? NaN : Number(value);
  if (!isFinite(n) || n < 0) return 0;
  return n;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Pure purification calculator (amounts in EGP, ratio as a percentage number).
 * - 'received-profits': ratio% × (dividends + capital gain).
 * - 'dividends-only': ratio% × dividends.
 * Returns null when the ratio is missing or invalid; missing amounts count as 0.
 */
export function calculatePurification(
  dividends: number | null | undefined,
  capitalGain: number | null | undefined,
  ratioPct: number | null | undefined,
  approach: CalculatorApproach
): number | null {
  const ratio = ratioPct == null ? NaN : Number(ratioPct);
  if (!isFinite(ratio) || ratio < 0) return null;
  const base = approach === 'received-profits'
    ? sanitizeAmount(dividends) + sanitizeAmount(capitalGain)
    : sanitizeAmount(dividends);
  return round2((ratio / 100) * base);
}
