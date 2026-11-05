import { Injectable } from '@angular/core';
import { HostListener } from '@angular/core';
import { ApiService } from '../../../core/api/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { SessionCacheService } from '../../../core/services/session-cache.service';
import { FundListItemDto, FetchFundMissingPricesResultDto } from '../../../shared/models/api.models';
import { AdminFundCategoriesService } from './admin-fund-categories.service';
import { FundCategoryRow } from '../models/fund-category-row.model';

@Injectable({ providedIn: 'root' })
export class AdminFundDetailsService {
  constructor(
    private api: ApiService,
    private toast: ToastService,
    private sessionCache: SessionCacheService,
    private categories: AdminFundCategoriesService
  ) {
    this.categories.onCategoryReset = (id: number) => {
      if (this.selectedFundId) this.openFund(this.selectedFundId);
    };
  }

  // Fund view
  fundQuery = '';

  fundResults: FundListItemDto[] = [];

  fundPage = 1;

  fundTotalPages = 0;

  selectedFundId: number | null = null;

  fundCatRows: FundCategoryRow[] = [];

  fetchingMissingPrices: Record<number, boolean> = {};

  missingPricesResults: Record<number, FetchFundMissingPricesResultDto | null> = {};

  missingPricesErrors: Record<number, string | null> = {};

  // Fund Names & Description Editor
  editingFundId: number | null = null;

  editingFundCode = '';

  fundDetailsDraft = { nameAr: '', displayName: '', descriptionAr: '' };

  fundDetailsOriginal = { nameAr: '', displayName: '', descriptionAr: '' };

  savingFundDetails = false;

  fundDetailsSaveSuccess: string | null = null;

  fundDetailsSaveError: string | null = null;

  get isFundDetailsDirty(): boolean {
    if (!this.editingFundId) return false;
    return (
      this.fundDetailsDraft.nameAr !== this.fundDetailsOriginal.nameAr ||
      this.fundDetailsDraft.displayName !== this.fundDetailsOriginal.displayName ||
      this.fundDetailsDraft.descriptionAr !== this.fundDetailsOriginal.descriptionAr
    );
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.isFundDetailsDirty) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  searchAdminFunds(page = 1): void {
    this.fundPage = page;
    const q = this.fundQuery.trim();
    this.api.getAllFundsAdmin(q || undefined, undefined, page, 20).subscribe({
      next: (res) => {
        this.fundResults = res.items || [];
        this.fundTotalPages = res.totalPages || 0;
      },
      error: () => {}
    });
  }

  fetchMissingPrices(fundId: number): void {
    if (this.fetchingMissingPrices[fundId]) return;
    this.fetchingMissingPrices[fundId] = true;
    this.missingPricesErrors[fundId] = null;
    this.missingPricesResults[fundId] = null;

    this.api.fetchFundMissingPrices(fundId).subscribe({
      next: (res) => {
        this.fetchingMissingPrices[fundId] = false;
        this.missingPricesResults[fundId] = res;
        this.toast.show(res.message || 'اكتمل سحب الأسعار الناقصة');
      },
      error: (err) => {
        this.fetchingMissingPrices[fundId] = false;
        const body = err?.error;
        const msg = body?.message || err?.message || 'حدث خطأ أثناء سحب الأسعار الناقصة';
        this.missingPricesErrors[fundId] = msg;
        this.toast.show(msg);
      }
    });
  }

  openFundDetailsEditor(fund: FundListItemDto): void {
    if (this.isFundDetailsDirty && this.editingFundId !== fund.id) {
      if (!confirm('لديك تعديلات غير محفوظة على الاسم أو الوصف. هل تريد تجاهلها والانتقال لصندوق آخر؟')) {
        return;
      }
    }
    this.editingFundId = fund.id;
    this.editingFundCode = fund.code;
    this.fundDetailsSaveSuccess = null;
    this.fundDetailsSaveError = null;

    // Load full fund record from admin endpoint to ensure descriptionAr and displayName are fresh
    this.api.getFundAdmin(fund.id).subscribe({
      next: (full) => {
        const nameAr = full.nameAr || fund.nameAr || '';
        const displayName = full.displayName ?? fund.displayName ?? nameAr;
        const descriptionAr = full.descriptionAr ?? fund.descriptionAr ?? '';
        this.fundDetailsOriginal = { nameAr, displayName, descriptionAr };
        this.fundDetailsDraft = { nameAr, displayName, descriptionAr };
      },
      error: () => {
        const nameAr = fund.nameAr || '';
        const displayName = fund.displayName ?? nameAr;
        const descriptionAr = fund.descriptionAr ?? '';
        this.fundDetailsOriginal = { nameAr, displayName, descriptionAr };
        this.fundDetailsDraft = { nameAr, displayName, descriptionAr };
      }
    });
  }

  closeFundDetailsEditor(): void {
    if (this.isFundDetailsDirty) {
      if (!confirm('لديك تعديلات غير محفوظة. هل أنت متأكد من إغلاق المحرر؟')) {
        return;
      }
    }
    this.editingFundId = null;
    this.editingFundCode = '';
    this.fundDetailsSaveSuccess = null;
    this.fundDetailsSaveError = null;
  }

  revertFundDetailsDraft(): void {
    this.fundDetailsDraft = { ...this.fundDetailsOriginal };
    this.fundDetailsSaveSuccess = null;
    this.fundDetailsSaveError = null;
  }

  saveFundDetails(): void {
    if (!this.editingFundId || this.savingFundDetails) return;
    const nameAr = this.fundDetailsDraft.nameAr.trim();
    if (!nameAr) {
      this.fundDetailsSaveError = 'الاسم الكامل للصندوق مطلوب.';
      return;
    }
    if (nameAr.length > 250) {
      this.fundDetailsSaveError = 'الاسم الكامل لا يمكن أن يتجاوز 250 حرفاً.';
      return;
    }
    const displayName = this.fundDetailsDraft.displayName.trim();
    if (displayName.length > 250) {
      this.fundDetailsSaveError = 'اسم العرض لا يمكن أن يتجاوز 250 حرفاً.';
      return;
    }
    const descriptionAr = this.fundDetailsDraft.descriptionAr;
    if (descriptionAr.length > 10000) {
      this.fundDetailsSaveError = 'وصف الصندوق لا يمكن أن يتجاوز 10000 حرف.';
      return;
    }

    this.savingFundDetails = true;
    this.fundDetailsSaveError = null;
    this.fundDetailsSaveSuccess = null;

    this.api.updateFundAdminDetails(this.editingFundId, {
      nameAr,
      displayName,
      descriptionAr
    }).subscribe({
      next: (updated) => {
        this.savingFundDetails = false;
        const savedNameAr = updated.nameAr || nameAr;
        const savedDisplayName = updated.displayName ?? displayName;
        const savedDesc = updated.descriptionAr ?? descriptionAr;
        this.fundDetailsOriginal = {
          nameAr: savedNameAr,
          displayName: savedDisplayName,
          descriptionAr: savedDesc
        };
        this.fundDetailsDraft = { ...this.fundDetailsOriginal };
        this.fundDetailsSaveSuccess = 'تم حفظ الاسم والوصف بنجاح وتحديث الكاش.';
        this.toast.show('تم حفظ تعديلات الصندوق بنجاح');

        // Update row in local table immediately
        const idx = this.fundResults.findIndex(r => r.id === this.editingFundId);
        if (idx >= 0) {
          this.fundResults[idx] = {
            ...this.fundResults[idx],
            nameAr: savedNameAr,
            displayName: savedDisplayName || savedNameAr,
            fullNameAr: savedNameAr,
            descriptionAr: savedDesc,
            isNameManuallyEdited: true,
            isDescriptionManuallyEdited: true
          };
        }

        // Clear frontend session cache so navigating to public fund pages immediately fetches fresh data
        this.sessionCache.clear();
      },
      error: (err) => {
        this.savingFundDetails = false;
        const msg = err?.error?.message || err?.message || 'حدث خطأ أثناء حفظ التعديلات.';
        this.fundDetailsSaveError = msg;
        this.toast.show(msg);
      }
    });
  }

  openFund(id: number): void {
    this.selectedFundId = id;
    this.api.getFundCategoriesWithOverrides(id).subscribe({
      next: (rows: unknown) => { this.fundCatRows = (rows as FundCategoryRow[]) || []; },
      error: () => { this.fundCatRows = []; }
    });
  }

  setFundCategory(fundId: number, categoryId: number, action: 'include' | 'exclude' | 'reset'): void {
    const call = action === 'include'
      ? this.api.includeFundInCategory(fundId, categoryId)
      : action === 'exclude'
        ? this.api.excludeFundFromCategory(fundId, categoryId)
        : this.api.resetFundCategoryOverride(fundId, categoryId);
    call.subscribe({
      next: () => {
        this.toast.show(action === 'reset' ? 'أُعيد للتلقائي' : (action === 'include' ? 'تم التضمين' : 'تم الاستبعاد'));
        this.openFund(fundId);
        if (this.categories.selectedCategory) this.categories.loadMembers(this.categories.memberPage);
      },
      error: (err) => { this.toast.show('فشل الحفظ: ' + (err.error?.message || err.message || '')); }
    });
  }

  resetFund(fundId: number): void {
    this.categories.confirmBox = {
      title: 'إعادة للتلقائي',
      body: 'سيتم مسح كل التجاوزات اليدوية لهذا الصندوق.',
      confirmLabel: 'إعادة للتلقائي',
      run: () => {
        this.api.resetFundOverrides(fundId).subscribe({
          next: (res) => {
            this.toast.show(`تمت الإعادة للتلقائي (مُسح ${res.clearedCount})`);
            this.openFund(fundId);
            if (this.categories.selectedCategory) this.categories.loadMembers(this.categories.memberPage);
          },
          error: (err) => { this.toast.show('فشلت الإعادة: ' + (err.error?.message || err.message || '')); }
        });
      }
    };
  }
}
