import {
  normFundType,
  normFundRiskLevel,
  fundRiskLabelAr,
  normFundSyncStatus,
  fundSyncStatusLabelAr,
  normFundSyncDetailStatus,
  fundSyncDetailStatusLabelAr,
fundCategoryChangeLabelAr,
  fundLogoUrl,
  fundTypeChangeLabelAr
} from './fund-display';
import { environment } from '../../environments/environment';

describe('fund-display normalizers', () => {
  it('maps numeric backend FundType values to string unions', () => {
    expect(normFundType(4)).toBe('equity');
    expect(normFundType(8)).toBe('index');
    expect(normFundType(9)).toBe('money_market');
    expect(normFundType(0)).toBe('unknown');
    expect(normFundType(99)).toBe('unknown');
  });

  it('passes valid FundType strings through and rejects the rest', () => {
    expect(normFundType('equity')).toBe('equity');
    expect(normFundType('Gold')).toBe('gold');
    expect(normFundType('bogus')).toBe('unknown');
    expect(normFundType(null)).toBe('unknown');
    expect(normFundType(undefined)).toBe('unknown');
  });

  it('maps the legacy commodities alias to silver everywhere', () => {
    expect(normFundType('commodities')).toBe('silver');
    expect(normFundType('Commodities')).toBe('silver');
    expect(normFundType('silver')).toBe('silver');
  });

  it('maps numeric backend FundRiskLevel values to string unions', () => {
    expect(normFundRiskLevel(1)).toBe('low');
    expect(normFundRiskLevel(2)).toBe('medium');
    expect(normFundRiskLevel(3)).toBe('high');
    expect(normFundRiskLevel(0)).toBe('unknown');
    expect(normFundRiskLevel(7)).toBe('unknown');
  });

  it('passes valid risk strings through (the DB case: 82 high / 72 low / 18 medium)', () => {
    expect(normFundRiskLevel('high')).toBe('high');
    expect(normFundRiskLevel('low')).toBe('low');
    expect(normFundRiskLevel('whatever')).toBe('unknown');
  });

  it('returns null Arabic risk label when unknown so callers hide the field', () => {
    expect(fundRiskLabelAr('high')).toBe('عالية');
    expect(fundRiskLabelAr('medium')).toBe('متوسطة');
    expect(fundRiskLabelAr('low')).toBe('منخفضة');
    expect(fundRiskLabelAr('unknown')).toBeNull();
  });

  it('maps numeric sync statuses (the phantom-failure bug: 1 must be success)', () => {
    expect(normFundSyncStatus(1)).toBe('success');
    expect(normFundSyncStatus(0)).toBe('running');
    expect(normFundSyncStatus(2)).toBe('partial');
    expect(normFundSyncStatus(3)).toBe('failed');
  });

  it('maps string sync statuses case-insensitively', () => {
    expect(normFundSyncStatus('success')).toBe('success');
    expect(normFundSyncStatus('Success')).toBe('success');
    expect(normFundSyncStatus('PARTIAL')).toBe('partial');
    expect(normFundSyncStatus('failed')).toBe('failed');
    expect(normFundSyncStatus('Running')).toBe('running');
  });

  it('labels sync statuses in Arabic', () => {
    expect(fundSyncStatusLabelAr('success')).toBe('نجح');
    expect(fundSyncStatusLabelAr('partial')).toBe('جزئي');
    expect(fundSyncStatusLabelAr('failed')).toBe('فشل');
    expect(fundSyncStatusLabelAr('running')).toBe('قيد التشغيل');
  });

  it('labels category change-log actions (backend enum numbers)', () => {
    expect(fundCategoryChangeLabelAr(2)).toBe('تضمين يدوي');
    expect(fundCategoryChangeLabelAr(6)).toBe('إعادة للتلقائي');
    expect(fundCategoryChangeLabelAr(9)).toBe('حذف تصنيف');
    expect(fundCategoryChangeLabelAr(99)).toBe('—');
  });

  it('maps numeric per-fund detail statuses (backend enum) to labels', () => {
    expect(normFundSyncDetailStatus(0)).toBe('success');
    expect(normFundSyncDetailStatus(1)).toBe('failed');
    expect(normFundSyncDetailStatus(2)).toBe('skipped');
    expect(normFundSyncDetailStatus('Success')).toBe('success');
    expect(fundSyncDetailStatusLabelAr(normFundSyncDetailStatus(0))).toBe('نجح');
    expect(fundSyncDetailStatusLabelAr(normFundSyncDetailStatus(2))).toBe('متخطى');
  });
});

describe('fundLogoUrl', () => {
  const base = environment.apiBaseUrl.replace(/\/+$/, '');

  it('prefers the real remote logoUrl when present', () => {
    expect(fundLogoUrl('funds/pharos-fund-1.jpg', 'https://snduk/x.png'))
      .toBe('https://snduk/x.png');
  });

  it('strips a leading funds/ segment so the path is not doubled', () => {
    expect(fundLogoUrl('funds/beltone.jpg', '')).toBe(`${base}/fund-logos/beltone.jpg`);
  });

  it('tolerates a leading slash', () => {
    expect(fundLogoUrl('/funds/x.jpg', '')).toBe(`${base}/fund-logos/x.jpg`);
  });

  it('passes an already-absolute local value through unchanged', () => {
    expect(fundLogoUrl('https://cdn.example/a.png', '')).toBe('https://cdn.example/a.png');
  });

  it('resolves a protocol-relative value over https', () => {
    expect(fundLogoUrl('//cdn.example/a.png', '')).toBe('https://cdn.example/a.png');
  });

  it('falls back to the remote URL when no local file exists', () => {
    expect(fundLogoUrl('', 'https://snduk/x.png')).toBe('https://snduk/x.png');
    expect(fundLogoUrl(null, 'https://snduk/x.png')).toBe('https://snduk/x.png');
  });

it('returns null when neither source has a value', () => {
    expect(fundLogoUrl('', '')).toBeNull();
    expect(fundLogoUrl(null, null)).toBeNull();
    expect(fundLogoUrl(undefined, undefined)).toBeNull();
  });

  it('treats whitespace-only values as missing', () => {
    expect(fundLogoUrl('   ', '   ')).toBeNull();
  });
});

describe('fundTypeChangeLabelAr', () => {
  it('maps the numeric enum values', () => {
    expect(fundTypeChangeLabelAr(0)).toBe('إنشاء نوع');
    expect(fundTypeChangeLabelAr(7)).toBe('تعيين نوع يدوي');
    expect(fundTypeChangeLabelAr(8)).toBe('إلغاء التعيين اليدوي');
  });

  it('accepts the numeric value as a string', () => {
    expect(fundTypeChangeLabelAr('1')).toBe('إعادة تسمية');
  });

  it('falls back to a dash for null', () => {
    expect(fundTypeChangeLabelAr(null)).toBe('—');
  });
});
