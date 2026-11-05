import { Injectable } from '@angular/core';
import { ApiService } from '../../../core/api/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { FundTypeDefinition, FundTypeChangeLog, AdminTypeFundRow } from '../../../shared/models/api.models';
import { fundTypeChangeLabelAr } from '../../../shared/models/fund-display';

@Injectable({ providedIn: 'root' })
export class AdminFundTypesService {
  constructor(
    private api: ApiService,
    private toast: ToastService
  ) {}

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
}
