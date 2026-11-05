import type { PagedResult } from './common.model';
import type { ShariahSourceOpinionDto } from './shariah.model';

export const INDEX_ARABIC_NAMES: Record<string, string> = {
  'EGX30': 'EGX30',
  'EGX30TR': 'عائد كلي EGX30',
  'EGX70': 'EGX70',
  'EGX100': 'EGX100',
  'EGX35-LV': 'EGX35 منخفض التذبذب',
  'Shariah': 'مؤشر الشريعة',
  'Sectoral-Indices': 'قطاعي',
  'TAMAYUZ': 'مؤشر تميز'
};

export interface IndexSummaryDto {
  code: string;
  nameAr: string;
  nameEn: string;
  description?: string | null;
  constituentsCount: number;
  lastUpdated?: string | null;
}

export interface MarketSnapshotDto {
  kind: string;
  code: string;
  mubasherCode: string;
  value?: number | null;
  change?: number | null;
  changePct?: number | null;
  sourceDateText?: string | null;
  source?: string | null;
  fetchedAt?: string | null;
}

export interface IndexInStockDto {
  code: string;
  nameAr: string;
  nameEn: string;
  /** null when the source file for this index had no weight column */
  weight: number | null;
  isCapped?: boolean | null;
  cappingFactor?: number | null;
}

export interface ConstituentItemDto {
  ticker: string;
  nameAr?: string | null;
  nameEn?: string | null;
  indices: string[];
  shariahStatus?: string | null;
  /** Empty for board-governed stocks (external opinion panel suppressed). */
  shariahOpinions: ShariahSourceOpinionDto[];
  closingPrice?: number | null;
  changePct?: number | null;
  fairValue?: number | null;
  priceComparison?: string | null;
  fairValueDiffPct?: number | null;
  /** null when the source file for this index had no weight column */
  weight: number | null;
  currency?: string | null;
  sectorNameAr?: string | null;
  /** Stock overseen by a Sharia board/committee (unified simplified display). */
  hasShariahBoard?: boolean;
  shariahBoardNote?: string | null;
  marketCap?: number | null;
}

export interface IndexConstituentsPagedResultDto {
  indexCode: string;
  indexNameAr: string;
  indexNameEn: string;
  lastUpdated?: string | null;
  items: ConstituentItemDto[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface IndexPickerItem {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
}
