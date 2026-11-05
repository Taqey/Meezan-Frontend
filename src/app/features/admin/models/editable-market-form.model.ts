export interface EditableMarketForm {
  closingPrice: number | null;
  high: number | null;
  low: number | null;
  open: number | null;
  nominalValue: number | null;
  bookValue: number | null;
  eps: number | null;
  marketValue: number | null;
  peRatio: number | null;
  pbRatio: number | null;
  sharesOutstanding: number | null;
  earningsGrowthRate: number | null;
  epsGrowthRate: number | null;
  freeCashFlow: number | null;
  currency: string;
  sourceLastUpdateText: string;
  recalculateRatios: boolean;
}
