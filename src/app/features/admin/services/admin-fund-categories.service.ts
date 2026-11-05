import { Injectable } from '@angular/core';
import { ApiService } from '../../../core/api/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { FundCategory, FundListItemDto, FundCategoryChangeLog, CategoryFundMember, CreateCategoryRequest, UpdateCategoryRequest } from '../../../shared/models/api.models';
import { fundCategoryChangeLabelAr } from '../../../shared/models/fund-display';

@Injectable({ providedIn: 'root' })
export class AdminFundCategoriesService {
  constructor(
    private api: ApiService,
    private toast: ToastService
  ) {}

  // Categories
  categories: FundCategory[] = [];

  counts: Record<number, number | undefined> = {};

  catsLoading = false;

  catsBusy = false;

  showDeleted = false;

  // Editor modal
  editorOpen = false;

  editingCategory: FundCategory | null = null;

  editorForm: CreateCategoryRequest & { slug: string } = {
    nameAr: '', nameEn: '', slug: '', icon: '', color: '', isAutoDerived: false, autoRuleJson: '', isVisible: true, displayOrder: 0
  };

  editorKeywords = '';

  // Merge modal
  mergeSource: FundCategory | null = null;

  mergeTargetId = 0;

  get mergeTargets(): FundCategory[] {
    return this.categories.filter(c => !c.isDeleted && (!this.mergeSource || c.id !== this.mergeSource.id));
  }

  // Generic confirm
  confirmBox: { title: string; body: string; confirmLabel: string; run: () => void } | null = null;

  // Category detail
  selectedCategory: FundCategory | null = null;

  members: CategoryFundMember[] = [];

  memberTotal = 0;

  memberPage = 1;

  memberPageSize = 20;

  memberTotalPages = 0;

  memberSearch = '';

  memberSource = '';

  checkedMembers = new Set<number>();

  addSearch = '';

  addResults: FundListItemDto[] = [];

  checkedAdd = new Set<number>();

  // Change log
  changeLog: FundCategoryChangeLog[] = [];

  logLoading = false;

  logPage = 1;

  logPageSize = 20;

  logTotalPages = 0;

  logCategoryId: number | null = null;

  changeActionLabel(a: unknown): string { return fundCategoryChangeLabelAr(a); }

  loadCategories(): void {
    this.catsLoading = true;
    this.api.getAllFundCategories(true).subscribe({
      next: (cats) => {
        this.categories = cats || [];
        this.catsLoading = false;
        this.refreshCounts();
        if (this.selectedCategory) {
          const fresh = this.categories.find(c => c.id === this.selectedCategory!.id);
          this.selectedCategory = fresh && !fresh.isDeleted ? fresh : null;
          if (!this.selectedCategory) this.members = [];
        }
      },
      error: () => { this.catsLoading = false; }
    });
  }

  private refreshCounts(): void {
    this.categories.filter(c => !c.isDeleted).forEach(c => {
      this.api.getCategoryFunds(c.id, '', '', 1, 1).subscribe({
        next: (res) => { this.counts[c.id] = res.totalCount; },
        error: () => {}
      });
    });
  }

  openEditor(cat?: FundCategory): void {
    this.editingCategory = cat || null;
    if (cat) {
      this.editorForm = {
        nameAr: cat.nameAr, nameEn: cat.nameEn, slug: cat.slug,
        icon: cat.icon || '', color: cat.color || '',
        isAutoDerived: cat.isAutoDerived, autoRuleJson: cat.autoRuleJson || '',
        isVisible: cat.isVisible, displayOrder: cat.displayOrder || 0
      };
      this.editorKeywords = this.keywordsFromRule(cat.autoRuleJson);
    } else {
      const order = Math.max(0, ...this.categories.map(c => c.displayOrder || 0)) + 1;
      this.editorForm = {
        nameAr: '', nameEn: '', slug: '', icon: '', color: '',
        isAutoDerived: false, autoRuleJson: '', isVisible: true, displayOrder: order
      };
      this.editorKeywords = '';
    }
    this.editorOpen = true;
  }

  private keywordsFromRule(ruleJson: string): string {
    try {
      const rule = JSON.parse(ruleJson || '{}');
      return Array.isArray(rule?.keywords) ? rule.keywords.join(', ') : '';
    } catch { return ''; }
  }

  saveCategory(): void {
    if (!this.editorForm.nameAr.trim() || !this.editorForm.nameEn.trim()) {
      this.toast.show('يرجى إدخال الاسم بالعربية والإنجليزية');
      return;
    }
    const payload: CreateCategoryRequest & UpdateCategoryRequest = {
      nameAr: this.editorForm.nameAr.trim(),
      nameEn: this.editorForm.nameEn.trim(),
      icon: this.editorForm.icon?.trim() || '',
      color: this.editorForm.color?.trim() || '',
      isAutoDerived: this.editorForm.isAutoDerived,
      autoRuleJson: this.editorForm.isAutoDerived
        ? JSON.stringify({ keywords: this.editorKeywords.split(',').map(k => k.trim()).filter(Boolean), field: 'name' })
        : '',
      isVisible: this.editorForm.isVisible,
      displayOrder: Number(this.editorForm.displayOrder) || 0
    };
    this.catsBusy = true;
    if (!this.editingCategory) {
      if (this.editorForm.slug.trim()) (payload as CreateCategoryRequest).slug = this.editorForm.slug.trim();
      this.api.createFundCategory(payload).subscribe({
        next: () => {
          this.catsBusy = false;
          this.editorOpen = false;
          this.toast.show('تم إنشاء التصنيف');
          this.loadCategories();
        },
        error: (err) => {
          this.catsBusy = false;
          this.toast.show('فشل إنشاء التصنيف: ' + (err.error?.message || err.message || 'خطأ غير متوقع'));
        }
      });
    } else {
      this.api.updateFundCategory(this.editingCategory.id, payload).subscribe({
        next: () => {
          this.catsBusy = false;
          this.editorOpen = false;
          this.toast.show('تم حفظ التعديلات');
          this.loadCategories();
          if (this.selectedCategory?.id === this.editingCategory!.id) this.loadMembers(1);
        },
        error: (err) => {
          this.catsBusy = false;
          this.toast.show('فشل حفظ التعديلات: ' + (err.error?.message || err.message || 'خطأ غير متوقع'));
        }
      });
    }
  }

  askDeleteCategory(cat: FundCategory): void {
    const n = this.counts[cat.id];
    this.confirmBox = {
      title: 'حذف التصنيف',
      body: `سيتم حذف "${cat.nameAr}"${n !== undefined ? ` (يحتوي على ${n} صندوق)` : ''}.\nلن يعيد السحب إنشاءه، ويمكن استعادته من قائمة المحذوفة.`,
      confirmLabel: 'حذف',
      run: () => {
        this.confirmBox = null;
        this.catsBusy = true;
        this.api.deleteFundCategory(cat.id).subscribe({
          next: () => {
            // Reached only when the category had no funds (server deletes immediately).
            this.catsBusy = false;
            this.toast.show('تم حذف التصنيف');
            this.afterCategoryGone(cat.id);
          },
          error: (err) => {
            this.catsBusy = false;
            const msg = err.error?.message || '';
            const count = err.error?.fundCount;
            if (err.status === 400 && typeof count === 'number') {
              this.confirmBox = {
                title: 'تأكيد الحذف',
                body: `التصنيف يحتوي على ${count} صندوق. هل أنت متأكد من المتابعة؟${msg ? '\n' + msg : ''}`,
                confirmLabel: 'حذف نهائي',
                run: () => {
                  this.confirmBox = null;
                  this.catsBusy = true;
                  this.api.deleteFundCategory(cat.id, true).subscribe({
                    next: () => { this.catsBusy = false; this.toast.show('تم حذف التصنيف'); this.afterCategoryGone(cat.id); },
                    error: (e2) => { this.catsBusy = false; this.toast.show('فشل الحذف: ' + (e2.error?.message || e2.message || '')); }
                  });
                }
              };
            } else {
              this.toast.show('فشل الحذف: ' + (msg || err.message || 'خطأ غير متوقع'));
            }
          }
        });
      }
    };
  }

  private afterCategoryGone(id: number): void {
    if (this.selectedCategory?.id === id) {
      this.selectedCategory = null;
      this.members = [];
    }
    this.loadCategories();
  }

  restoreCategory(id: number): void {
    this.api.restoreFundCategory(id).subscribe({
      next: () => { this.toast.show('تمت استعادة التصنيف'); this.loadCategories(); },
      error: (err) => { this.toast.show('فشلت الاستعادة: ' + (err.error?.message || err.message || '')); }
    });
  }

  openMerge(cat: FundCategory): void {
    this.mergeSource = cat;
    this.mergeTargetId = 0;
  }

  doMerge(): void {
    if (!this.mergeSource || !this.mergeTargetId || this.mergeTargetId === this.mergeSource.id) return;
    const sourceId = this.mergeSource.id;
    this.catsBusy = true;
    this.api.mergeFundCategories({ sourceCategoryId: sourceId, targetCategoryId: this.mergeTargetId }).subscribe({
      next: (res: any) => {
        this.catsBusy = false;
        this.mergeSource = null;
        this.mergeTargetId = 0;
        this.toast.show(`تم الدمج (نُقل ${res?.movedOverrides ?? 0} ارتباط)`);
        this.afterCategoryGone(sourceId);
      },
      error: (err) => {
        this.catsBusy = false;
        this.toast.show('فشل الدمج: ' + (err.error?.message || err.message || ''));
      }
    });
  }

  runConfirm(): void {
    const action = this.confirmBox?.run;
    this.confirmBox = null;
    action?.();
  }

  selectCategory(id: number): void {
    const cat = this.categories.find(c => c.id === id) || null;
    this.selectedCategory = cat;
    this.checkedMembers.clear();
    this.checkedAdd.clear();
    this.addResults = [];
    this.addSearch = '';
    this.memberSearch = '';
    this.memberSource = '';
    if (cat) this.loadMembers(1);
  }

  loadMembers(page = 1): void {
    if (!this.selectedCategory) return;
    this.memberPage = page;
    this.api.getCategoryFunds(this.selectedCategory.id, this.memberSearch.trim(), this.memberSource, page, this.memberPageSize).subscribe({
      next: (res) => {
        this.members = res.items || [];
        this.memberTotal = res.totalCount || 0;
        this.memberTotalPages = res.totalPages || 0;
        this.checkedMembers.clear();
      },
      error: () => {}
    });
  }

  get allMembersChecked(): boolean {
    return this.members.length > 0 && this.members.every(m => this.checkedMembers.has(m.id));
  }

  toggleAllMembers(checked: boolean): void {
    this.checkedMembers = checked ? new Set(this.members.map(m => m.id)) : new Set<number>();
  }

  toggleMemberCheck(id: number, checked: boolean): void {
    if (checked) this.checkedMembers.add(id);
    else this.checkedMembers.delete(id);
  }

  removeFundFromCategory(m: CategoryFundMember): void {
    if (!this.selectedCategory) return;
    this.api.excludeFundFromCategory(m.id, this.selectedCategory.id).subscribe({
      next: () => {
        this.toast.show(`تمت إزالة ${m.code} من التصنيف (استبعاد يدوي — يبقى مستبعداً بعد المزامنة)`);
        this.loadMembers(this.memberPage);
        this.refreshCounts();
      },
      error: (err) => { this.toast.show('فشلت الإزالة: ' + (err.error?.message || err.message || '')); }
    });
  }

  bulkRemoveFromCategory(): void {
    if (!this.selectedCategory || !this.checkedMembers.size) return;
    const ids = [...this.checkedMembers];
    let done = 0, failed = 0;
    ids.forEach(id => {
      this.api.excludeFundFromCategory(id, this.selectedCategory!.id).subscribe({
        next: () => { done++; this.finishBulkRemove(ids.length, done, failed); },
        error: () => { failed++; this.finishBulkRemove(ids.length, done, failed); }
      });
    });
  }

  private finishBulkRemove(total: number, done: number, failed: number): void {
    if (done + failed < total) return;
    this.toast.show(failed ? `تمت إزالة ${done} وفشل ${failed}` : `تمت إزالة ${done} صندوق`);
    this.loadMembers(this.memberPage);
    this.refreshCounts();
  }

  searchFundsToAdd(): void {
    const q = this.addSearch.trim();
    if (!q) {
      this.addResults = [];
      return;
    }
    this.api.getAllFundsAdmin(q, undefined, 1, 10).subscribe({
      next: (res) => {
        const memberIds = new Set(this.members.map(m => m.id));
        this.addResults = (res.items || []).filter(f => !memberIds.has(f.id));
      },
      error: () => {}
    });
  }

  toggleAddCheck(id: number, checked: boolean): void {
    if (checked) this.checkedAdd.add(id);
    else this.checkedAdd.delete(id);
  }

  bulkAddToCategory(): void {
    if (!this.selectedCategory || !this.checkedAdd.size) return;
    const ids = [...this.checkedAdd];
    let done = 0, failed = 0;
    ids.forEach(id => {
      this.api.includeFundInCategory(id, this.selectedCategory!.id).subscribe({
        next: () => { done++; this.finishBulkAdd(ids.length, done, failed); },
        error: () => { failed++; this.finishBulkAdd(ids.length, done, failed); }
      });
    });
  }

  private finishBulkAdd(total: number, done: number, failed: number): void {
    if (done + failed < total) return;
    this.checkedAdd.clear();
    this.addResults = [];
    this.addSearch = '';
    this.toast.show(failed ? `تمت إضافة ${done} وفشل ${failed}` : `تمت إضافة ${done} صندوق`);
    this.loadMembers(this.memberPage);
    this.refreshCounts();
  }

  onCategoryReset?: (id: number) => void;

  resetCategory(id: number): void {
    this.confirmBox = {
      title: 'إعادة للتلقائي',
      body: 'سيتم مسح كل التجاوزات اليدوية في هذا التصنيف (يبقى الاستنتاج التلقائي).',
      confirmLabel: 'إعادة للتلقائي',
      run: () => {
        this.api.resetCategoryOverrides(id).subscribe({
          next: (res) => {
            this.toast.show(`تمت الإعادة للتلقائي (مُسح ${res.clearedCount})`);
            this.loadMembers(this.memberPage);
            if (this.onCategoryReset) this.onCategoryReset(id);
          },
          error: (err) => { this.toast.show('فشلت الإعادة: ' + (err.error?.message || err.message || '')); }
        });
      }
    };
  }

  loadChangeLog(page = 1): void {
    this.logLoading = true;
    this.logPage = page;
    this.api.getFundCategoryChanges({ categoryId: this.logCategoryId ?? undefined, page, pageSize: this.logPageSize }).subscribe({
      next: (res) => {
        this.changeLog = res.items || [];
        this.logTotalPages = res.totalPages || 0;
        this.logLoading = false;
      },
      error: () => { this.logLoading = false; }
    });
  }
}
