import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Plus,
  Search,
  X,
  Check,
  History,
  Save,
  RefreshCw,
  Edit3,
  Trash2,
  Undo2,
  RotateCcw,
  PiggyBank
} from 'lucide-angular';
import { ApiService } from '../../../core/api/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { SessionCacheService } from '../../../core/services/session-cache.service';
import { AdminClassificationComponent } from '../admin-classification/admin-classification.component';
import {
  FundCategory,
  FundListItemDto,
  FundSyncLog,
  FundSyncLogDetail,
  FundCategoryChangeLog,
  CategoryFundMember,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  FundTypeDefinition,
  FundTypeChangeLog,
  AdminTypeFundRow,
  FetchFundMissingPricesResultDto
} from '../../../shared/models/api.models';
import {
  normFundSyncStatus,
  fundSyncStatusLabelAr,
  fundSyncStatusColor,
  normFundSyncDetailStatus,
  fundSyncDetailStatusLabelAr,
  fundCategoryChangeLabelAr,
  fundTypeChangeLabelAr
} from '../../../shared/models/fund-display';

interface FundCategoryRow {
  category: FundCategory;
  isIncluded: boolean;
  source: string;
  overrideId?: number | null;
}

@Component({
  selector: 'app-admin-funds',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, AdminClassificationComponent],
  templateUrl: './admin-funds.component.html',
  styleUrl: './admin-funds.component.css',
})
export class AdminFundsComponent implements OnInit {
  readonly PiggyBankIcon = PiggyBank;
  readonly PlusIcon = Plus;
  readonly SearchIcon = Search;
  readonly XIcon = X;
  readonly CheckIcon = Check;
  readonly HistoryIcon = History;
  readonly SaveIcon = Save;
  readonly RefreshIcon = RefreshCw;
  readonly EditIcon = Edit3;
  readonly TrashIcon = Trash2;
  readonly UndoIcon = Undo2;
  readonly RotateIcon = RotateCcw;

  section: 'sync' | 'categories' | 'classification' | 'types' | 'funds' | 'log' = 'classification';

  // ── Editable fund types ──
  types: FundTypeDefinition[] = [];
  typeCounts: Record<number, number | undefined> = {};
  typeDraft = { nameAr: '', nameEn: '' };
  typeChanges: FundTypeChangeLog[] = [];
  typeMergeSource: FundTypeDefinition | null = null;
  typeMergeTargetId: number = 0;
  readonly fundTypeChangeLabelAr = fundTypeChangeLabelAr;

  typeDirty: Record<number, boolean> = {};
  typeOriginal: Record<number, Partial<FundTypeDefinition>> = {};

  // Type-funds panel
  typeFundsFor: { id: number; nameAr: string } | null = null;
  typeFundsItems: AdminTypeFundRow[] = [];
  typeFundsTotal = 0;
  typeFundsPage = 1;
  typeFundsTotalPages = 0;
  typeFundsSearch = '';

  get activeTypes(): FundTypeDefinition[] {
    return this.types.filter(t => !t.isDeleted);
  }

  loadTypes(): void {
    this.api.getAllFundTypes(true).subscribe({
      next: (rows) => {
        this.types = rows || [];
        this.types.forEach(t => {
          this.typeDirty[t.id] = false;
          this.typeOriginal[t.id] = { ...t };
          // Use the fundCount baked into the list response
          if (typeof (t as any).fundCount === 'number') {
            this.typeCounts[t.id] = (t as any).fundCount;
          }
        });
        this.api.getFundTypeChanges(1, 25).subscribe({
          next: (res) => this.typeChanges = res.items || [],
          error: () => {}
        });
      },
      error: () => this.toast.show('تعذّر تحميل أنواع الصناديق')
    });
  }

  createType(): void {
    if (!this.typeDraft.nameAr.trim() || !this.typeDraft.nameEn.trim()) {
      this.toast.show('اكتب الاسم بالعربية والإنجليزية');
      return;
    }
    this.api.createFundType({
      nameAr: this.typeDraft.nameAr.trim(),
      nameEn: this.typeDraft.nameEn.trim(),
      displayOrder: (this.types.length + 1) * 10,
      isVisible: true
    }).subscribe({
      next: () => {
        this.toast.show('تمت إضافة النوع');
        this.typeDraft = { nameAr: '', nameEn: '' };
        this.loadTypes();
      },
      error: () => this.toast.show('تعذّر إضافة النوع')
    });
  }

  updateType(id: number, patch: any): void {
    this.api.updateFundType(id, patch).subscribe({
      next: () => this.loadTypes(),
      error: () => this.toast.show('تعذّر تحديث النوع')
    });
  }

  toggleTypeVisibility(t: FundTypeDefinition): void {
    this.updateType(t.id, { isVisible: !t.isVisible });
  }

  deleteType(t: FundTypeDefinition): void {
    const n = this.typeCounts[t.id] ?? 0;
    if (!confirm(`سيتم حذف النوع "${t.nameAr}". عدد الصناديق المرتبطة به: ${n}. متابعة؟`)) return;
    this.api.deleteFundType(t.id, true).subscribe({
      next: () => { this.toast.show('تم حذف النوع'); this.loadTypes(); },
      error: (e) => this.toast.show(e?.error?.message || 'تعذّر حذف النوع')
    });
  }

  restoreType(t: FundTypeDefinition): void {
    this.api.restoreFundType(t.id).subscribe({
      next: () => { this.toast.show('تمت الاستعادة'); this.loadTypes(); },
      error: () => this.toast.show('تعذّرت الاستعادة')
    });
  }

  openMergeSource(t: FundTypeDefinition): void {
    this.typeMergeSource = t;
    this.typeMergeTargetId = 0;
  }

  confirmMerge(): void {
    if (!this.typeMergeSource || !this.typeMergeTargetId) return;
    if (this.typeMergeTargetId === this.typeMergeSource.id) return;
    this.api.mergeFundTypes({ sourceId: this.typeMergeSource.id, targetId: this.typeMergeTargetId }).subscribe({
      next: () => {
        this.toast.show('تم الدمج');
        this.typeMergeSource = null;
        this.loadTypes();
      },
      error: () => this.toast.show('تعذّر الدمج')
    });
  }

  onTypeChange(type: FundTypeDefinition, field: keyof FundTypeDefinition, value: any): void {
    (type as Record<string, any>)[field] = value;
    this.typeDirty[type.id] = true;
  }

  saveType(type: FundTypeDefinition): void {
    const patch = { ...this.typeOriginal[type.id], ...type } as Record<string, any>;
    delete patch['id'];
    this.api.updateFundType(type.id, patch).subscribe({
      next: () => {
        this.toast.show('تم الحفظ');
        this.typeDirty[type.id] = false;
        this.typeOriginal[type.id] = { ...type };
        this.loadTypes();
      },
      error: () => this.toast.show('تعذّر الحفظ')
    });
  }

  revertType(type: FundTypeDefinition): void {
    if (!this.typeOriginal[type.id]) return;
    Object.assign(type, this.typeOriginal[type.id]);
    this.typeDirty[type.id] = false;
  }

  viewTypeFunds(t: FundTypeDefinition): void {
    this.typeFundsFor = { id: t.id, nameAr: t.nameAr };
    this.typeFundsSearch = '';
    this.loadTypeFunds(1);
  }

  loadTypeFunds(page = 1): void {
    if (!this.typeFundsFor) return;
    this.typeFundsPage = page;
    this.api.getFundTypeMembers(this.typeFundsFor.id, this.typeFundsSearch.trim() || undefined, page, 25).subscribe({
      next: (res) => {
        this.typeFundsItems = res.items || [];
        this.typeFundsTotal = res.totalCount || 0;
        this.typeFundsTotalPages = res.totalPages || 0;
      },
      error: () => this.toast.show('تعذّر تحميل صناديق النوع')
    });
  }

  setFundTypeFromPanel(m: AdminTypeFundRow, typeId: number): void {
    this.api.moveFundType(m.id, typeId).subscribe({
      next: () => {
        this.toast.show('تم تعيين النوع');
        this.loadTypeFunds(this.typeFundsPage);
        this.loadTypes();
      },
      error: () => this.toast.show('تعذّر تعيين النوع')
    });
  }

  resetFundTypeFromPanel(m: AdminTypeFundRow): void {
    this.api.moveFundType(m.id, null).subscribe({
      next: () => {
        this.toast.show('أُعيد النوع للتلقائي');
        this.loadTypeFunds(this.typeFundsPage);
        this.loadTypes();
      },
      error: () => this.toast.show('تعذّرت إعادة التعيين')
    });
  }

  // Sync history
  syncRuns: FundSyncLog[] = [];
  syncLoading = false;
  syncPage = 1;
  syncTotalPages = 0;
  selectedRunId: number | null = null;
  runDetails: FundSyncLogDetail[] = [];
  runDetailsLoading = false;

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

  // Change log
  changeLog: FundCategoryChangeLog[] = [];
  logLoading = false;
  logPage = 1;
  logPageSize = 20;
  logTotalPages = 0;
  logCategoryId: number | null = null;

  constructor(private api: ApiService, private toast: ToastService, private sessionCache: SessionCacheService) {}

  ngOnInit(): void {
    this.loadCategories();
    this.searchAdminFunds(1);
  }

  // ── shared labels ──────────────────────────────────────────────
  syncStatusLabel(s: unknown): string { return fundSyncStatusLabelAr(normFundSyncStatus(s)); }
  syncStatusColor(s: unknown): string { return fundSyncStatusColor(normFundSyncStatus(s)); }
  detailStatusLabel(s: unknown): string { return fundSyncDetailStatusLabelAr(normFundSyncDetailStatus(s)); }
  changeActionLabel(a: unknown): string { return fundCategoryChangeLabelAr(a); }

  // ── sync history ───────────────────────────────────────────────
  loadSyncHistory(page = 1): void {
    this.syncLoading = true;
    this.syncPage = page;
    this.api.getFundSyncHistory(page, 20).subscribe({
      next: (res) => {
        this.syncRuns = res.items || [];
        this.syncTotalPages = res.totalPages || 0;
        this.syncLoading = false;
      },
      error: () => { this.syncLoading = false; }
    });
  }

  toggleRunDetails(runId: number): void {
    if (this.selectedRunId === runId) {
      this.selectedRunId = null;
      this.runDetails = [];
      return;
    }
    this.selectedRunId = runId;
    this.runDetailsLoading = true;
    this.api.getFundSyncRunDetails(runId).subscribe({
      next: (details) => {
        this.runDetails = (details || []).filter(d => normFundSyncDetailStatus(d.status) !== 'success');
        if (!this.runDetails.length) this.runDetails = details || [];
        this.runDetailsLoading = false;
      },
      error: () => { this.runDetailsLoading = false; }
    });
  }

  // ── categories ─────────────────────────────────────────────────
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

  // ── category detail ────────────────────────────────────────────
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
            if (this.selectedFundId) this.openFund(this.selectedFundId);
          },
          error: (err) => { this.toast.show('فشلت الإعادة: ' + (err.error?.message || err.message || '')); }
        });
      }
    };
  }

  // ── fund view ──────────────────────────────────────────────────
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
        if (this.selectedCategory) this.loadMembers(this.memberPage);
      },
      error: (err) => { this.toast.show('فشل الحفظ: ' + (err.error?.message || err.message || '')); }
    });
  }

  resetFund(fundId: number): void {
    this.confirmBox = {
      title: 'إعادة للتلقائي',
      body: 'سيتم مسح كل التجاوزات اليدوية لهذا الصندوق.',
      confirmLabel: 'إعادة للتلقائي',
      run: () => {
        this.api.resetFundOverrides(fundId).subscribe({
          next: (res) => {
            this.toast.show(`تمت الإعادة للتلقائي (مُسح ${res.clearedCount})`);
            this.openFund(fundId);
            if (this.selectedCategory) this.loadMembers(this.memberPage);
          },
          error: (err) => { this.toast.show('فشلت الإعادة: ' + (err.error?.message || err.message || '')); }
        });
      }
    };
  }

  // ── change log ─────────────────────────────────────────────────
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
