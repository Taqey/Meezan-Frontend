export type ComplianceStatus = 'compliant' | 'non_compliant' | 'doubtful'
export type FairValueComparison = 'cheap' | 'expensive' | 'fair'

export type StockSummary = {
  code: string
  name_ar: string
  name_en: string
  sector_ar: string
  industry_ar: string
  price: number
  change_pct: number
  currency: string
  last_update: string
  support_resistance_position: string
  shariah_compliant_count: number
  shariah_total_sources: number
  fair_value: number
  price_vs_fair_value: FairValueComparison
  indices: string[]
}

export type StockDetail = StockSummary & {
  url_source: string
  market_data: { volume: string; nominal_value: number; market_value: number; book_value: number; pb_ratio: number; eps: number; pe_ratio: number; high: number; low: number; open: number; last_update_raw: string }
  support_resistance: { pivot: number; r1: number; r2: number; s1: number; s2: number; position: string }
  fair_value_detail: { final_value: number; confidence: string; methods_used_count: number; methods_excluded_count: number; methods: { name: string; value: number; is_outlier: boolean }[]; price_comparison: FairValueComparison; diff_from_price_pct: number }
  shariah_opinions: { compliant_count: number; total_sources: number; sources: { source_key: string; source_label_ar: string; status: ComplianceStatus; percentage?: number; note: string; last_updated: string | null; pdf_url?: string }[]; purification: { haram_earnings_percentage: number; loans_percentage: number; aaoifi_haram_earning_per_share: number } }
  index_memberships: { code: string; name_ar: string; weight: number }[]
}

export type Index = { code: string; name_ar: string; description_ar: string; constituents_count: number; last_updated: string; constituents: { code: string; weight: number }[] }

export const stocks: StockDetail[] = []
export const indices: Index[] = []
export const meta = { last_price_update: 'غير متوفر', last_shariah_sync: 'غير متوفر', total_stocks_tracked: 0, last_price_update_status: 'unknown', last_shariah_sync_status: 'unknown' }

// Static market data snapshot bundled with the app (no backend/API involved).
import staticData from './data/market-data.json'

export const api = {
  getStocks: async () => (staticData.stocks as unknown as StockSummary[]),
  getStockByCode: async (code: string) => (staticData.stocks as unknown as StockDetail[]).find((s) => s.code === code) as StockDetail,
  getIndices: async () => (staticData.indices as unknown as Index[]),
  getIndexByCode: async (code: string) => (staticData.indices as unknown as Index[]).find((i) => i.code === code) as Index,
  getMeta: async () => staticData.meta as typeof meta,
}

export async function hydrateFromBackend() {
  const [remoteStocks, remoteIndices, remoteMeta] = await Promise.all([api.getStocks(), api.getIndices(), api.getMeta()])
  stocks.splice(0, stocks.length, ...remoteStocks as StockDetail[])
  indices.splice(0, indices.length, ...remoteIndices)
  Object.assign(meta, remoteMeta)
  return { stocks: remoteStocks, indices: remoteIndices, meta: remoteMeta }
}
export const formatNumber = (value: number) => new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 2 }).format(value)
export const formatPercent = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
export const getStock = (code: string) => stocks.find((s) => s.code === code)
export const getIndex = (code: string) => indices.find((i) => i.code === code)
export const getSectors = () => [...new Set(stocks.map((s) => s.sector_ar))]
export const getIndustries = () => [...new Set(stocks.map((s) => s.industry_ar))]
export const getIndexCodes = () => indices.map((i) => i.code)
export const allIndexCodes = new Proxy([] as string[], {
  get(target, prop, receiver) {
    const list = indices.map((i) => i.code)
    return Reflect.get(list, prop, receiver)
  }
})
export const allStocks = stocks
export const allIndices = indices
export const globalMeta = meta
export const apiBaseUrl = ''
export const getStockSummary = (code: string) => { const stock = getStock(code); return stock ? { ...stock, fair_value: stock.fair_value_detail.final_value } : undefined }
export const getIndexStocks = (code: string) => { const item = getIndex(code); return item?.constituents.map((c) => ({ ...getStockSummary(c.code), weight: c.weight })).filter(Boolean) ?? [] }
export const statusLabel = (status: ComplianceStatus) => status === 'compliant' ? 'متوافق' : status === 'non_compliant' ? 'غير متوافق' : 'مُشكِل / يحتاج مراجعة'
export const comparisonLabel = (comparison: FairValueComparison) => comparison === 'cheap' ? 'أقل من القيمة العادلة' : comparison === 'expensive' ? 'أعلى من القيمة العادلة' : 'قريبة من القيمة العادلة'
export const positionLabel = (position: string) => position.includes('pivot') ? 'قرب نقطة الارتكاز' : position.includes('s') ? 'منطقة دعم' : 'منطقة مقاومة'
export const sourceStatusClass = (status: ComplianceStatus) => status === 'compliant' ? 'status-good' : status === 'non_compliant' ? 'status-bad' : 'status-warn'
export const isPositive = (value: number) => value >= 0
export const getMarketLeaders = () => [...stocks].sort((a, b) => b.change_pct - a.change_pct).slice(0, 3)
export const getFeaturedIndex = () => getIndex('EGX33')!
export const getDateLabel = (value: string | null) => value ? value : 'غير متوفر'
export const getSourceCountLabel = (count: number, total: number) => `${count} من ${total} جهات`
export const getInitialRoute = () => typeof window === 'undefined' ? '/' : window.location.hash.replace('#', '') || '/'
export const navigate = (path: string) => { window.location.hash = path }
export const getQuery = () => typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.hash.split('?')[1] || '')
export const buildPath = (path: string, params?: Record<string, string>) => `${path}${params ? `?${new URLSearchParams(params).toString()}` : ''}`
export const getFilteredStocks = (params: URLSearchParams) => stocks.filter((s) => (!params.get('index') || s.indices.includes(params.get('index')!)) && (!params.get('sector') || s.sector_ar === params.get('sector')) && (!params.get('comparison') || s.price_vs_fair_value === params.get('comparison')) && (!params.get('shariah_min') || s.shariah_compliant_count >= Number(params.get('shariah_min'))) && (!params.get('q') || `${s.code} ${s.name_ar} ${s.name_en}`.toLowerCase().includes(params.get('q')!.toLowerCase())))
export const sortedStocks = (items: StockDetail[], sort: string) => [...items].sort((a, b) => sort === 'change' ? b.change_pct - a.change_pct : sort === 'price' ? b.price - a.price : sort === 'name' ? a.name_ar.localeCompare(b.name_ar) : b.fair_value_detail.diff_from_price_pct - a.fair_value_detail.diff_from_price_pct)
export const routeTo = (path: string) => { if (typeof window !== 'undefined') window.location.hash = path }
export const stockPath = (code: string) => `#/stocks/${code}`
export const indexPath = (code: string) => `#/indices/${code}`
export const stocksPath = '#/stocks'
export const indicesPath = '#/indices'
export const homePath = '#/'
export const shariahThresholds = [3, 5, 7]
export const fairValueOptions = [{ value: 'cheap', label: 'أرخص من قيمتها العادلة' }, { value: 'fair', label: 'قريبة من قيمتها العادلة' }, { value: 'expensive', label: 'أغلى من قيمتها العادلة' }]
export const sortOptions = [{ value: 'change', label: 'نسبة التغير' }, { value: 'price', label: 'السعر' }, { value: 'fair', label: 'الفارق عن القيمة العادلة' }, { value: 'name', label: 'الاسم' }]
export const positionOptions = ['below_s2', 'between_s2_s1', 'between_s1_pivot', 'between_pivot_r1', 'between_r1_r2', 'above_r2']
export const sourceStatusOptions: ComplianceStatus[] = ['compliant', 'non_compliant', 'doubtful']
export const appConfig = { apiBaseUrl: apiBaseUrl, siteName: 'ميزان EGX', locale: 'ar-EG', direction: 'rtl' }
export default api
