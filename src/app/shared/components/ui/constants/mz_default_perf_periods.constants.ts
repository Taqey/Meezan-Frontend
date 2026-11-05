import { type MzPerfPeriod } from '../models/mz-perf-period.model';

export const MZ_DEFAULT_PERF_PERIODS: MzPerfPeriod[] = [
  { id: '1W', label: 'أسبوع' },
  { id: '1M', label: '1 شهر' },
  { id: '3M', label: '3 أشهر' },
  { id: '6M', label: '6 أشهر' },
  { id: '1Y', label: 'سنة' },
  { id: '3Y', label: '3 سنين' },
  { id: '5Y', label: '5 سنين' }
];
