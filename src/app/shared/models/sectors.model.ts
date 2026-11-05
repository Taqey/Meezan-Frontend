export interface SectorSummaryDto {
  id: number;
  nameAr: string;
  nameEn: string;
  stocksCount: number;
  /** Effective-verdict compliant count. Absent on older API responses. */
  compliantStocksCount?: number | null;
  /** 100 × compliant / total. Absent on older API responses. */
  complianceRatePct?: number | null;
  /** Mean daily change % (stocks with a value). Absent on older API responses. */
  averageChangePct?: number | null;
  /** Summed market value in EGP. Absent on older API responses. */
  marketCapTotal?: number | null;
  /** Summed market value (EGP) of compliant stocks. Absent on older API responses. */
  compliantMarketCapTotal?: number | null;
  /** Mean P/E over positive values. Absent on older API responses. */
  averagePeRatio?: number | null;
  tradingDate?: string | null;
  computedAt?: string | null;
  approximate?: boolean;
  stocksUsed?: number | null;
  advancers?: number | null;
  decliners?: number | null;
  unchanged?: number | null;
  topContributorsJson?: string | null;
}

export interface SectorPickerItem {
  id: number;
  nameAr: string;
  nameEn: string;
}
