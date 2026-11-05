export type ShariahStatus = 'Compliant' | 'NonCompliant' | 'Pending' | 'Blocked';
/**
 * 'Unavailable' = no trustworthy fair value could be computed (zero applicable methods,
 * nothing survived the outlier fallback, or the stock's own price is missing/zero).
 * In that state fairValue / fairValueDiff / fairValueDiffPct are all null, the
 * valuationConfidence is 'None' and no Cheap/Expensive/Fair verdict may be shown.
 * A null priceComparison means the stock has no fair-value row at all — treat it as
 * 'Unavailable'.
 */
export type PriceComparison = 'Cheap' | 'Expensive' | 'Fair' | 'Unavailable';
export type ValuationConfidence = 'None' | 'Low' | 'Medium' | 'High';


export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
