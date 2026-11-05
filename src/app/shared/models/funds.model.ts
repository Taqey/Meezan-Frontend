// ── Funds ────────────────────────────────────────────────────────────────

export type FundType =
  | 'balanced'
  | 'capital_preservation'
  | 'commodities'
  | 'silver'
  | 'equity'
  | 'fixed_income'
  | 'fixed_income_usd'
  | 'gold'
  | 'index'
  | 'money_market'
  | 'unknown';

export type FundRiskLevel = 'low' | 'medium' | 'high' | 'unknown';

export type FundSortBy = 
  | 'return1m' 
  | 'return3m' 
  | 'return6m' 
  | 'return1y' 
  | 'return3y' 
  | 'aum' 
  | 'managementFee' 
  | 'totalScore' 
  | 'name' 
  | 'currentPrice';

export interface FundListItemDto {
  id: number;
  sndukId: number;
  publicId: string;
  slug: string;
  nameAr: string;
  displayName?: string | null;
  fullNameAr?: string | null;
  nameEn: string;
  descriptionAr?: string | null;
  isNameManuallyEdited?: boolean;
  isDescriptionManuallyEdited?: boolean;
  code: string;
  type: FundType;
  typeNameAr: string;
  typeNameEn: string;
  /** Id of the editable type row backing the effective type. */
  typeId?: number | null;
  /** Stable slug of the effective type, e.g. "equity". */
  typeSlug?: string | null;
  /** True when an operator overrode the SNDUK-derived type. */
  typeIsOverridden?: boolean;
  /** Effective classification node slug (tree). */
  classificationSlug?: string | null;
  /** Full Arabic breadcrumb path, e.g. "صندوق أسهم › صندوق مؤشر › EGX33". */
  classificationPathAr?: string | null;
  /** Assignment source: Manual | Auto | SNDUK | None. */
  classificationSource?: string | null;
  riskLevel: FundRiskLevel;
  isIslamic: boolean;
  isFeatured: boolean;
  currentPrice: number | null;
  dailyChange: number | null;
  return1M: number | null;
  return3M: number | null;
  return6M: number | null;
  return1Y: number | null;
  return3Y: number | null;
  totalScore: number | null;
  aum: number | null;
  managementFee: number | null;
  minimumInvestment: string;
  currency: string;
  assetManagerId: number | null;
  assetManagerName: string;
  assetManagerNameEn: string;
  logoUrl: string;
  localLogoPath: string;
  lastSyncedAt: string | null;
  effectiveClassification?: EffectiveClassificationDto | null;
}

export interface EffectiveClassificationDto {
  nodeId?: number | null;
  slug: string;
  nameAr: string;
  nameEn: string;
  path: string;
  rootSlug: string;
  rootNameAr: string;
  rootNameEn: string;
  leafSlug: string;
  leafNameAr: string;
  leafNameEn: string;
  source: string;
  pathSlugs: string[];
  pathNamesAr: string[];
  pathNamesEn: string[];
}

export interface FundDetailDto extends FundListItemDto {
  descriptionAr: string;
  descriptionEn: string;
  investmentStrategy: string;
  inceptionDate: string | null;
  prospectusUrl: string;
  priceHistory: FundPricePointDto[];
  analysis: FundAnalysisDto | null;
  similarFunds: FundSimilarDto[];
  categoryMemberships: FundCategoryMembershipDto[];
}

export interface FundPricePointDto {
  date: string;
  price: number;
  change: number | null;
  performance: number | null;
}

export interface FundAnalysisDto {
  performanceScore: number | null;
  riskScore: number | null;
  costScore: number | null;
  stabilityScore: number | null;
  diversificationScore: number | null;
  totalScore: number | null;
  cagr: number | null;
  alpha: number | null;
  volatility: number | null;
  consistency: number | null;
  maxDrawdown: number | null;
  sharpeRatio: number | null;
  performanceExplanationAr: string;
  performanceExplanationEn: string;
  riskExplanationAr: string;
  riskExplanationEn: string;
  costExplanationAr: string;
  costExplanationEn: string;
  stabilityExplanationAr: string;
  stabilityExplanationEn: string;
  diversificationExplanationAr: string;
  diversificationExplanationEn: string;
  calculatedAt: string;
}

export interface FundSimilarDto {
  id: number;
  /** URL-friendly slug for routing (e.g. /funds/:slug). */
  slug?: string | null;
  code: string;
  nameAr: string;
  displayName?: string | null;
  fullNameAr?: string | null;
  nameEn: string;
  /** Local logo path (served from the API host) when a file was downloaded. */
  localLogoPath?: string | null;
  /** Original SNDUK/Supabase logo URL used as fallback. */
  logoUrl?: string | null;
  typeNameAr?: string | null;
  typeNameEn?: string | null;
  typeSlug?: string | null;
  classificationPathAr?: string | null;
  effectiveClassification?: EffectiveClassificationDto | null;
}

/** One row of the editable fund-type catalog (powers the public type dropdown). */
export interface FundTypeOptionDto {
  id: number;
  slug: string;
  nameAr: string;
  nameEn: string;
  displayOrder: number;
}

/** Admin view of a fund type, including soft-delete and audit fields. */
export interface FundTypeDefinition {
  id: number;
  slug: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  color: string;
  displayOrder: number;
  isVisible: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedReason: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  /** Computed effective fund count (returned in list endpoint). */
  fundCount?: number;
}

/** Chip shown inside the type-funds panel. */
export interface FundCategoryChip {
  id: number;
  slug: string;
  nameAr: string;
}

/** Rich fund row inside a type's fund list (GET /api/admin/funds/types/{id}/funds). */
export interface AdminTypeFundRow {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
  assetManagerName: string;
  effectiveTypeId: number | null;
  effectiveTypeSlug: string;
  effectiveTypeNameAr: string;
  /** 'SNDUK' | 'يدوي' | 'تلقائي - يتبع مؤشر' */
  source: string;
  originalSndukSlug: string | null;
  originalSndukNameAr: string | null;
  overrideTypeId: number | null;
  categories: FundCategoryChip[];
}

export interface FundTypeChangeLog {
  id: number;
  fundId: number | null;
  fundTypeDefinitionId: number | null;
  action: number;
  performedBy: string;
  reason: string | null;
  createdAt: string;
  fund?: { id: number; code: string; nameAr: string } | null;
  definition?: { id: number; slug: string; nameAr: string; nameEn: string } | null;
}

export interface CreateFundTypeRequest {
  nameAr: string;
  nameEn: string;
  slug?: string | null;
  icon?: string | null;
  color?: string | null;
  displayOrder: number;
  isVisible: boolean;
}

export interface UpdateFundTypeRequest {
  nameAr?: string | null;
  nameEn?: string | null;
  icon?: string | null;
  color?: string | null;
  displayOrder?: number | null;
  isVisible?: boolean | null;
}

export interface MergeFundTypesRequest {
  sourceId: number;
  targetId: number;
}

export interface FundCategoryDto {
  id: number;
  nameAr: string;
  nameEn: string;
  slug: string;
  icon: string;
  color: string;
  isAutoDerived: boolean;
  displayOrder: number;
}

export interface FundCategoryMembershipDto {
  categoryId: number;
  categoryNameAr: string;
  categoryNameEn: string;
  categorySlug: string;
  source: string; // "Auto" | "Manual" | "Excluded" | "None"
}

export interface FundListFilter {
  search?: string;
  type?: string;
  /** Tree node slug + descendants (e.g. node=equity includes index/sector/active/unclassified funds). */
  node?: string;
  /** Tree node slug + descendants (any level). */
  subType?: string;
  /** Tree node slug, direct assignment only. */
  leaf?: string;
  riskLevel?: string;
  assetManagerId?: number;
  isIslamic?: boolean;
  isFeatured?: boolean;
  categoryId?: number;
  minManagementFee?: number;
  maxManagementFee?: number;
  minInvestment?: number;
  maxInvestment?: number;
  sortBy?: FundSortBy;
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/** One node of the public classification tree (visible nodes that contain funds). */
export interface FundClassificationTreeNode {
  id: number;
  slug: string;
  nameAr: string;
  nameEn: string;
  level: number;
  parentSlug: string | null;
  displayOrder: number;
  childrenLabelAr: string;
  childrenLabelEn: string;
  directFundCount: number;
  totalFundCount: number;
  hasAutoRule: boolean;
}

export interface FundAssetManagerOption {
  id: number;
  nameAr: string;
  nameEn: string;
  fundCount: number;
}

/** One node of the admin classification tree (all nodes + counts + audit fields). */
export interface AdminClassificationNode {
  id: number;
  parentId: number | null;
  level: number;
  slug: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  color: string;
  displayOrder: number;
  isVisible: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedReason: string;
  requiresChildSelection: boolean;
  childrenLabelAr: string;
  childrenLabelEn: string;
  autoRuleJson: string;
  autoClassificationEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  directCount: number;
  totalCount: number;
}

export interface ClassificationNodeFundRow {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
  assetManagerName: string;
  path: string;
  source: string;
  reason: string;
  needsReview: boolean;
  isManual: boolean;
}

export interface ClassificationReviewRow {
  fundId: number;
  code: string;
  nameAr: string;
  nameEn: string;
  assetManagerName: string;
  description: string | null;
  investmentStrategy: string | null;
  reason: string;
  path: string;
  source: string;
  isManual: boolean;
}

export interface ClassificationReview {
  unclassifiedCount: number;
  conflictingCount: number;
  missingChildCount: number;
  unclassifiedEquity: ClassificationReviewRow[];
  conflicting: ClassificationReviewRow[];
  missingChild: ClassificationReviewRow[];
}

export interface ReclassifyResult {
  processed: number;
  moved: number;
  remaining: number;
  failed: number;
  movedCodes: string[];
  errors: string[];
}

export interface ClassificationMigrationChanged {
  code: string;
  name: string;
  oldPath: string;
  newPath: string;
  reason: string;
}

export interface ClassificationMigrationReport {
  seedPerformed: boolean;
  backupPerformed: boolean;
  backupRows: number;
  changed: ClassificationMigrationChanged[];
  unclassifiedEquity: string[];
  commoditiesRenamed: number;
  commoditiesFunds: string[];
  notes: string[];
}

export interface CreateClassificationNodeRequest {
  parentId?: number | null;
  slug?: string | null;
  nameAr: string;
  nameEn: string;
  icon?: string | null;
  color?: string | null;
  displayOrder?: number | null;
  isVisible?: boolean | null;
  requiresChildSelection?: boolean | null;
  childrenLabelAr?: string | null;
  childrenLabelEn?: string | null;
  autoRuleJson?: string | null;
  autoClassificationEnabled?: boolean | null;
  fundDisposition?: string | null;
}

export interface UpdateClassificationNodeRequest {
  slug?: string | null;
  nameAr?: string | null;
  nameEn?: string | null;
  icon?: string | null;
  color?: string | null;
  displayOrder?: number | null;
  isVisible?: boolean | null;
  requiresChildSelection?: boolean | null;
  childrenLabelAr?: string | null;
  childrenLabelEn?: string | null;
  autoRuleJson?: string | null;
  autoClassificationEnabled?: boolean | null;
}

export interface FundPagedResultDto {
  items: FundListItemDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Admin Fund Models
export interface FundSyncSettings {
  id: number;
  isEnabled: boolean;
  runTimeCairo: string; // HH:mm format
  preventOverlap: boolean;
  requestDelaySeconds: number;
  maxRetries: number;
  retryBackoffSeconds: number;
  updatedAt: string;
  updatedBy: string;
}

export interface FundSyncLog {
  id: number;
  runAt: string;
  finishedAt: string | null;
  status: 'running' | 'success' | 'partial' | 'failed';
  mode?: 'Prices' | 'Full' | string;
  totalFunds: number;
  updatedFunds: number;
  failedFunds: number;
  skippedFunds: number;
  errorSummary: string | null;
  triggeredBy: string;
  durationSeconds: number;
}

export interface FundSyncStatusDto {
  isRunning: boolean;
  mode?: string | null;
  triggeredBy?: string | null;
  startedAtUtc?: string | null;
  totalFunds: number;
  processedCount: number;
  updatedCount: number;
  failedCount: number;
  currentFundCode?: string | null;
  currentPhase?: string | null;
  finishedAtUtc?: string | null;
  lastResultSummary?: string | null;
  error?: string | null;
}

export interface FundPriceSyncResultDto {
  totalSndukFunds: number;
  updatedFunds: number;
  missingFromSndukCount: number;
  newInSndukCount: number;
  durationSeconds: number;
  syncedAtUtc: string;
  message?: string | null;
}

export interface FundSyncLogDetail {
  id: number;
  fundSyncLogId: number;
  fundId: number;
  fundCode: string;
  status: 'success' | 'failed' | 'skipped';
  errorMessage: string | null;
  attemptedAt: string;
}

export interface FundSyncRunRequest {
  triggeredBy?: string;
}

export interface FundSyncSettingsUpdateRequest {
  isEnabled?: boolean;
  runTimeCairo?: string;
  preventOverlap?: boolean;
  requestDelaySeconds?: number;
  maxRetries?: number;
  retryBackoffSeconds?: number;
  autoClassificationEnabled?: boolean;
  fullSyncScheduleEnabled?: boolean;
  fullSyncRunTimeCairo?: string;
}

export interface FundCategory {
  id: number;
  nameAr: string;
  nameEn: string;
  slug: string;
  icon: string;
  color: string;
  isAutoDerived: boolean;
  autoRuleJson: string;
  isVisible: boolean;
  displayOrder: number;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedReason: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface FundCategoryOverride {
  id: number;
  fundId: number;
  categoryId: number;
  action: 'include' | 'exclude';
  createdAt: string;
  createdBy: string;
}

export interface CategoryChangeAction {
  action: 'include' | 'exclude' | 'reset';
}

export interface CreateCategoryRequest {
  nameAr: string;
  nameEn: string;
  slug?: string;
  icon?: string;
  color?: string;
  isAutoDerived?: boolean;
  autoRuleJson?: string;
  isVisible?: boolean;
  displayOrder?: number;
}

export interface UpdateCategoryRequest {
  nameAr?: string;
  nameEn?: string;
  slug?: string;
  icon?: string;
  color?: string;
  isVisible?: boolean;
  displayOrder?: number;
  autoRuleJson?: string;
}

export interface MergeCategoriesRequest {
  sourceCategoryId: number;
  targetCategoryId: number;
}

export interface CategoryFundMember {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
  source: string; // "Auto" | "Manual"
  reason: string;
}

export interface FundCategoryChangeLog {
  id: number;
  fundId: number | null;
  categoryId: number;
  action: string;
  performedBy: string;
  reason: string | null;
  createdAt: string;
  fund?: { id: number; code: string; nameAr: string };
  category?: { id: number; nameAr: string; nameEn: string };
}

export interface FundCategoryChangeLogFilter {
  fundId?: number;
  categoryId?: number;
  action?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

export interface FetchFundMissingPricesResultDto {
  fundId: number;
  fundCode: string;
  fundNameAr: string;
  sndukId: number;
  timeframeRequested: string;
  addedCount: number;
  missingRangesFound: string[];
  addedDates: string[];
  sourceMissingDates: string[];
  nothingMissing: boolean;
  onCooldown: boolean;
  alreadyRunning: boolean;
  cooldownRemainingSeconds: number;
  message: string;
  ranAtUtc: string;
  triggeredBy: string;
}

export interface UpdateAdminFundDetailsRequest {
  nameAr: string;
  displayName?: string | null;
  descriptionAr?: string | null;
}



