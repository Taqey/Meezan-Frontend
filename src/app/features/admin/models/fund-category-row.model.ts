import { FundCategory } from '../../../shared/models/api.models';

export interface FundCategoryRow {
  category: FundCategory;
  isIncluded: boolean;
  source: string;
  overrideId?: number | null;
}
