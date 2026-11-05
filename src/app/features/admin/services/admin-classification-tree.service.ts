import { Injectable } from '@angular/core';
import { ApiService } from '../../../core/api/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { AdminClassificationReviewService } from './admin-classification-review.service';
import { AdminClassificationNode } from '../../../shared/models/api.models';
@Injectable({ providedIn: 'root' })
export class AdminClassificationTreeService {
  /** Optional callback registered by FundsService to avoid circular DI */
  onReclassifyDone?: () => void;
  constructor(
    private api: ApiService,
    private toast: ToastService,
    private review: AdminClassificationReviewService
  ) {}
  tree: AdminClassificationNode[] = [];

  flatTree: AdminClassificationNode[] = [];

  private childIds = new Set<number>();

  treeLoading = false;

  showDeleted = false;

  expanded = new Set<number>();

  publicTree: any[] = [];

  autoEnabled = true;

  seedBusy = false;

  reclassBusy = false;

  lastReport: any = null;

  editorOpen = false;

  editingNode: AdminClassificationNode | null = null;

  editorParent: AdminClassificationNode | null = null;

  editorParentHasFunds = false;

  editorParentFundCount = 0;

  editorFundDisposition: 'keep' | 'moveAll' = 'keep';

  editorForm = { nameAr: '', nameEn: '', slug: '', icon: '', color: '', displayOrder: 0, isVisible: true, requiresChildSelection: false, childrenLabelAr: 'التصنيف الفرعي', childrenLabelEn: 'Sub classification', autoClassificationEnabled: true };

  editorKeywords = '';

  nodeBusy = false;

  moveNode: AdminClassificationNode | null = null;

  moveParentId: number | null = null;

  moveTargets: AdminClassificationNode[] = [];

  mergeSource: AdminClassificationNode | null = null;

  mergeTargetId = 0;

  deletePreview: any = null;

  deleteFundsChoice: string = 'auto';

  confirmBox: { title: string; body: string; confirmLabel: string; run: () => void } | null = null;

  trackNode = (_: number, n: { id: number }) => n.id;

  trackIndex = (i: number) => i;

  refreshAll(): void {
    this.loadTree();
    this.review.loadReview();
    this.api.getFundSyncSettings().subscribe({ next: (s: any) => this.autoEnabled = s?.autoClassificationEnabled ?? true, error: () => {} });
  }

  private rebuildFlatTree(): void {
    const byParent = new Map<number | null, AdminClassificationNode[]>();
    const childIds = new Set<number>();
    for (const n of this.tree) {
      const k = n.parentId ?? null;
      let list = byParent.get(k);
      if (!list) { list = []; byParent.set(k, list); }
      list.push(n);
      if (!n.isDeleted && n.parentId != null) childIds.add(n.parentId);
    }
    for (const list of byParent.values()) {
      list.sort((a, b) => a.displayOrder - b.displayOrder || a.nameAr.localeCompare(b.nameAr, 'ar'));
    }
    const out: AdminClassificationNode[] = [];
    const walk = (pid: number | null) => {
      for (const n of byParent.get(pid) ?? []) {
        out.push(n);
        if (this.expanded.has(n.id) || pid === null) walk(n.id);
      }
    };
    walk(null);
    this.childIds = childIds;
    this.flatTree = out;
  }

  hasChildren(id: number): boolean {
    return this.childIds.has(id);
  }

  toggleExpand(id: number): void {
    if (this.expanded.has(id)) this.expanded.delete(id);
    else this.expanded.add(id);
    this.rebuildFlatTree();
  }

  indentLabel(n: AdminClassificationNode): string {
    return '— '.repeat(Math.min(n.level, 5)) + n.nameAr;
  }

  loadTree(): void {
    this.treeLoading = true;
    this.api.getClassificationAdminTree(this.showDeleted).subscribe({
      next: (rows) => {
        this.tree = rows || [];
        // Expand all roots by default.
        for (const n of this.tree) if (n.parentId == null) this.expanded.add(n.id);
        this.rebuildFlatTree();
        this.treeLoading = false;
      },
      error: () => { this.treeLoading = false; this.toast.show('تعذّر تحميل الشجرة'); }
    });
    this.api.getClassificationTree().subscribe({ next: (t) => this.publicTree = t || [], error: () => {} });
  }

  toggleAuto(): void {
    this.api.updateFundSyncSettings({ autoClassificationEnabled: !this.autoEnabled } as any).subscribe({
      next: () => { this.autoEnabled = !this.autoEnabled; this.toast.show(this.autoEnabled ? 'فُعّلت الأتمتة' : 'عُطّلت الأتمتة'); },
      error: () => this.toast.show('تعذّر تغيير الإعداد')
    });
  }

  runSeedMigrate(): void {
    this.confirmBox = {
      title: 'تهيئة وترحيل',
      body: 'سيتم إنشاء العقد الناقصة وترحيل التعيينات اليدوية. العملية آمنة ولا تكرر نفسها.',
      confirmLabel: 'تشغيل',
      run: () => {
        this.seedBusy = true;
        this.api.seedMigrateClassification().subscribe({
          next: (rep) => { this.seedBusy = false; this.lastReport = rep; this.toast.show(`اكتمل: ${rep.changed?.length ?? 0} تغييراً`); this.refreshAll(); },
          error: () => { this.seedBusy = false; this.toast.show('فشل الترحيل'); }
        });
      }
    };
  }

  runReclassify(): void {
    this.reclassBusy = true;
    this.api.reclassifyUnclassified().subscribe({
      next: (r) => {
        this.reclassBusy = false;
        this.toast.show(`أعيد تصنيف ${r.moved} من ${r.processed} (متبقٍ ${r.remaining})`);
        this.refreshAll();
        this.onReclassifyDone?.();
      },
      error: () => { this.reclassBusy = false; this.toast.show('فشلت إعادة التصنيف'); }
    });
  }

  openEditor(node: AdminClassificationNode | null, parentId?: number | null): void {
    this.editingNode = node;
    this.editorParent = parentId != null ? (this.tree.find(n => n.id === parentId) ?? null) : null;
    if (node) {
      this.editorForm = {
        nameAr: node.nameAr, nameEn: node.nameEn, slug: node.slug, icon: node.icon || '', color: node.color || '',
        displayOrder: node.displayOrder, isVisible: node.isVisible, requiresChildSelection: node.requiresChildSelection,
        childrenLabelAr: node.childrenLabelAr, childrenLabelEn: node.childrenLabelEn,
        autoClassificationEnabled: node.autoClassificationEnabled
      };
      this.editorKeywords = this.keywordsFromRule(node.autoRuleJson);
    } else {
      this.editorForm = {
        nameAr: '', nameEn: '', slug: '', icon: '', color: '', displayOrder: 0, isVisible: true,
        requiresChildSelection: false, childrenLabelAr: 'التصنيف الفرعي', childrenLabelEn: 'Sub classification',
        autoClassificationEnabled: true
      };
      this.editorKeywords = '';
    }
    this.editorParentHasFunds = false;
    this.editorParentFundCount = 0;
    this.editorFundDisposition = 'keep';
    if (this.editorParent) {
      // Use the count we already have instead of a slow GetNodeFunds round-trip.
      this.editorParentFundCount = this.editorParent.directCount ?? 0;
      this.editorParentHasFunds = this.editorParentFundCount > 0;
    }
    this.editorOpen = true;
  }

  private keywordsFromRule(ruleJson: string): string {
    try {
      const rule = JSON.parse(ruleJson || '{}');
      return Array.isArray(rule?.keywords) ? rule.keywords.join(', ') : '';
    } catch { return ''; }
  }

  saveNode(): void {
    if (!this.editorForm.nameAr.trim() || !this.editorForm.nameEn.trim()) {
      this.toast.show('اكتب الاسم بالعربية والإنجليزية');
      return;
    }
    const ruleJson = this.editorKeywords.trim()
      ? JSON.stringify({ keywords: this.editorKeywords.split(',').map(k => k.trim()).filter(Boolean), field: 'name' })
      : (this.editingNode ? this.editingNode.autoRuleJson : '');
    this.nodeBusy = true;
    if (!this.editingNode) {
      this.api.createClassificationNode({
        parentId: this.editorParent?.id ?? null,
        slug: this.editorForm.slug.trim() || undefined,
        nameAr: this.editorForm.nameAr.trim(),
        nameEn: this.editorForm.nameEn.trim(),
        icon: this.editorForm.icon?.trim() || undefined,
        color: this.editorForm.color?.trim() || undefined,
        displayOrder: Number(this.editorForm.displayOrder) || 0,
        isVisible: this.editorForm.isVisible,
        requiresChildSelection: this.editorForm.requiresChildSelection,
        childrenLabelAr: this.editorForm.childrenLabelAr,
        childrenLabelEn: this.editorForm.childrenLabelEn,
        autoRuleJson: ruleJson || undefined,
        autoClassificationEnabled: this.editorForm.autoClassificationEnabled,
        fundDisposition: this.editorParent ? this.editorFundDisposition : undefined
      }).subscribe({
        next: () => { this.nodeBusy = false; this.editorOpen = false; this.toast.show('تم الإنشاء'); this.loadTree(); },
        error: (e) => { this.nodeBusy = false; this.toast.show(e?.error?.message || 'فشل الإنشاء'); }
      });
    } else {
      this.api.updateClassificationNode(this.editingNode.id, {
        slug: this.editorForm.slug.trim() || undefined,
        nameAr: this.editorForm.nameAr.trim(),
        nameEn: this.editorForm.nameEn.trim(),
        icon: this.editorForm.icon,
        color: this.editorForm.color,
        displayOrder: Number(this.editorForm.displayOrder) || 0,
        isVisible: this.editorForm.isVisible,
        requiresChildSelection: this.editorForm.requiresChildSelection,
        childrenLabelAr: this.editorForm.childrenLabelAr,
        childrenLabelEn: this.editorForm.childrenLabelEn,
        autoRuleJson: this.editorKeywords.trim() ? ruleJson : this.editingNode.autoRuleJson,
        autoClassificationEnabled: this.editorForm.autoClassificationEnabled
      }).subscribe({
        next: () => { this.nodeBusy = false; this.editorOpen = false; this.toast.show('تم الحفظ'); this.loadTree(); },
        error: (e) => { this.nodeBusy = false; this.toast.show(e?.error?.message || 'فشل الحفظ'); }
      });
    }
  }

  openMove(n: AdminClassificationNode): void {
    this.moveNode = n;
    this.moveParentId = n.parentId;
    // Computed once when the dialog opens (not a getter).
    const desc = new Set<number>();
    const walk = (id: number) => {
      for (const c of this.tree) {
        if (c.parentId === id) { desc.add(c.id); walk(c.id); }
      }
    };
    walk(n.id);
    this.moveTargets = this.tree.filter(x => !x.isDeleted && x.id !== n.id && !desc.has(x.id));
  }

  confirmMove(): void {
    if (!this.moveNode) return;
    this.api.moveClassificationNode(this.moveNode.id, this.moveParentId).subscribe({
      next: () => { this.toast.show('تم النقل'); this.moveNode = null; this.loadTree(); },
      error: (e) => this.toast.show(e?.error?.message || 'فشل النقل')
    });
  }

  openMerge(n: AdminClassificationNode): void {
    this.mergeSource = n;
    this.mergeTargetId = 0;
  }

  confirmMerge(): void {
    if (!this.mergeSource || !this.mergeTargetId) return;
    this.api.mergeClassificationNodes(this.mergeSource.id, this.mergeTargetId).subscribe({
      next: () => { this.toast.show('تم الدمج'); this.mergeSource = null; this.loadTree(); },
      error: (e) => this.toast.show(e?.error?.message || 'فشل الدمج')
    });
  }

  openDelete(n: AdminClassificationNode): void {
    this.api.deleteClassificationNodePreview(n.id).subscribe({
      next: (prev) => { this.deletePreview = { ...prev, node: n }; this.deleteFundsChoice = 'auto'; },
      error: () => this.toast.show('تعذّر فحص العقدة')
    });
  }

  confirmDelete(): void {
    if (!this.deletePreview) return;
    const id = this.deletePreview.node.id;
    const resetToAuto = this.deleteFundsChoice === 'auto';
    const moveTo = this.deleteFundsChoice.startsWith('node:') ? Number(this.deleteFundsChoice.slice(5)) : null;
    this.api.deleteClassificationNode(id, true, moveTo, resetToAuto).subscribe({
      next: (res: any) => {
        this.toast.show(`حُذفت العقدة (نُقل ${res?.movedFunds ?? 0})`);
        this.deletePreview = null;
        this.loadTree();
      },
      error: (e) => this.toast.show(e?.error?.message || 'فشل الحذف')
    });
  }

  restoreNode(n: AdminClassificationNode): void {
    this.api.restoreClassificationNode(n.id).subscribe({
      next: () => { this.toast.show('استُعيدت العقدة'); this.loadTree(); },
      error: (e) => this.toast.show(e?.error?.message || 'تعذّرت الاستعادة')
    });
  }

  runConfirm(): void {
    const action = this.confirmBox?.run;
    this.confirmBox = null;
    action?.();
  }
}
