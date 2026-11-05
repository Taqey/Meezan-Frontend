import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Plus,
  Search,
  X,
  RefreshCw,
  Edit3,
  Trash2,
  Undo2,
  RotateCcw,
  Eye,
  EyeOff,
  GitBranch,
  Save
} from 'lucide-angular';
import { ApiService } from '../../../core/api/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { ClassificationCascadeComponent } from '../../../shared/components/classification-cascade/classification-cascade.component';
import type {
  AdminClassificationNode,
  ClassificationNodeFundRow,
  ClassificationReview,
  ClassificationReviewRow
} from '../../../shared/models/api.models';

/**
 * Dedicated التصنيف tab: the full editable classification tree, the
 * "تحتاج مراجعة" workflow (unclassified first), manual assignment panels,
 * merge/delete/restore with explicit destinations, and the reclassification
 * action. No window.alert/confirm — in-app dialogs + toasts only.
 *
 * Performance notes:
 *  - flatTree / childIds / moveTargets are computed once (not getters).
 *  - [path]="emptyPath" is a stable reference (an inline [] is a new array on
 *    every change detection and re-triggers the cascade's ngOnChanges).
 *  - every *ngFor has a trackBy.
 */
@Component({
  selector: 'app-admin-classification',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, ClassificationCascadeComponent],
  templateUrl: './admin-classification.component.html',
})
export class AdminClassificationComponent implements OnInit {
  readonly PlusIcon = Plus;
  readonly SearchIcon = Search;
  readonly XIcon = X;
  readonly RefreshIcon = RefreshCw;
  readonly EditIcon = Edit3;
  readonly UndoIcon = Undo2;
  readonly SaveIcon = Save;

  /** Stable empty array so [path] doesn't change identity on every CD cycle. */
  readonly emptyPath: string[] = [];

  view: 'tree' | 'review' | 'log' = 'tree';
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

  review: ClassificationReview | null = null;
  reviewLoading = false;
  get reviewBadge(): number {
    return (this.review?.unclassifiedCount ?? 0) + (this.review?.conflictingCount ?? 0) + (this.review?.missingChildCount ?? 0);
  }
  checkedReview = new Set<number>();

  changeLog: any[] = [];
  logLoading = false;
  logPage = 1;
  logTotalPages = 0;

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

  fundsFor: AdminClassificationNode | null = null;
  fundsItems: ClassificationNodeFundRow[] = [];
  fundsTotal = 0;
  fundsPage = 1;
  fundsTotalPages = 0;
  fundsSearch = '';
  fundsSource = '';
  checkedFunds = new Set<number>();
  addSearch = '';
  addResults: any[] = [];
  checkedAdd = new Set<number>();

  bulkMoveOpen = false;
  bulkMovePath: string[] = [];
  get bulkMoveCount(): number { return this.checkedFunds.size + this.checkedReview.size; }

  confirmBox: { title: string; body: string; confirmLabel: string; run: () => void } | null = null;

  // ── trackBy ──
  trackNode = (_: number, n: { id: number }) => n.id;
  trackFund = (_: number, m: { id: number }) => m.id;
  trackReview = (_: number, r: { fundId: number }) => r.fundId;
  trackIndex = (i: number) => i;

  constructor(private api: ApiService, private toast: ToastService) {}

  ngOnInit(): void {
    this.refreshAll();
  }

  refreshAll(): void {
    this.loadTree();
    this.loadReview();
    this.api.getFundSyncSettings().subscribe({ next: (s: any) => this.autoEnabled = s?.autoClassificationEnabled ?? true, error: () => {} });
  }

  /** Computed once whenever the tree or expansion state changes (NOT a getter). */
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

  sourceAr(s: string): string {
    return s === 'Manual' ? 'يدوي' : s === 'Auto' ? 'تلقائي' : s === 'SNDUK' ? 'SNDUK' : s;
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
        if (this.fundsFor) this.loadNodeFunds(1);
      },
      error: () => { this.reclassBusy = false; this.toast.show('فشلت إعادة التصنيف'); }
    });
  }

  // ── editor ──
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

  // ── move / merge / delete / restore ──
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

  // ── node funds panel ──
  openFunds(n: AdminClassificationNode): void {
    this.fundsFor = n;
    this.fundsSearch = '';
    this.fundsSource = '';
    this.checkedFunds.clear();
    this.checkedAdd.clear();
    this.addResults = [];
    this.addSearch = '';
    this.loadNodeFunds(1);
  }

  loadNodeFunds(page = 1): void {
    if (!this.fundsFor) return;
    this.fundsPage = page;
    this.api.getClassificationNodeFunds(this.fundsFor.id, this.fundsSearch.trim(), this.fundsSource, page, 25).subscribe({
      next: (res) => {
        this.fundsItems = res.items || [];
        this.fundsTotal = res.totalCount || 0;
        this.fundsTotalPages = res.totalPages || 0;
        this.checkedFunds.clear();
      },
      error: () => this.toast.show('تعذّر تحميل الصناديق')
    });
  }

  toggleFundCheck(id: number, checked: boolean): void {
    if (checked) this.checkedFunds.add(id);
    else this.checkedFunds.delete(id);
  }

  resetFund(id: number): void {
    this.api.resetFundClassification(id).subscribe({
      next: () => { this.toast.show('أُعيد للتلقائي'); this.loadNodeFunds(this.fundsPage); this.loadTree(); },
      error: () => this.toast.show('تعذّرت الإعادة')
    });
  }

  assignFromCascade(fundId: number, path: string[]): void {
    if (!path.length) return;
    const slug = path[path.length - 1];
    const node = this.tree.find(n => n.slug === slug);
    if (!node) return;
    this.api.assignFundToNode(fundId, node.id).subscribe({
      next: () => { this.toast.show('تم التعيين اليدوي'); this.loadNodeFunds(this.fundsPage); this.loadTree(); this.loadReview(); },
      error: (e) => this.toast.show(e?.error?.message || 'فشل التعيين')
    });
  }

  searchFundsToAdd(): void {
    const q = this.addSearch.trim();
    if (!q) { this.addResults = []; return; }
    this.api.getAllFundsAdmin(q, undefined, 1, 10).subscribe({
      next: (res) => {
        const memberIds = new Set(this.fundsItems.map(m => m.id));
        this.addResults = (res.items || []).filter((f: any) => !memberIds.has(f.id));
      },
      error: () => {}
    });
  }

  toggleAddCheck(id: number, checked: boolean): void {
    if (checked) this.checkedAdd.add(id);
    else this.checkedAdd.delete(id);
  }

  bulkAdd(): void {
    if (!this.fundsFor || !this.checkedAdd.size) return;
    this.api.bulkAddFundsToNode(this.fundsFor.id, [...this.checkedAdd]).subscribe({
      next: (res) => {
        this.toast.show(res.failed ? `أُضيف ${res.added} وفشل ${res.failed}` : `أُضيف ${res.added}`);
        this.checkedAdd.clear();
        this.addResults = [];
        this.addSearch = '';
        this.loadNodeFunds(this.fundsPage);
        this.loadTree();
      },
      error: () => this.toast.show('فشلت الإضافة')
    });
  }

  confirmBulkMove(): void {
    if (!this.bulkMovePath.length) return;
    const slug = this.bulkMovePath[this.bulkMovePath.length - 1];
    const node = this.tree.find(n => n.slug === slug);
    if (!node) return;
    const ids = [...new Set([...this.checkedFunds, ...this.checkedReview])];
    let done = 0, failed = 0;
    const finish = () => {
      if (done + failed < ids.length) return;
      this.toast.show(failed ? `نُقل ${done} وفشل ${failed}` : `نُقل ${done}`);
      this.bulkMoveOpen = false;
      this.bulkMovePath = [];
      this.checkedFunds.clear();
      this.checkedReview.clear();
      this.loadTree();
      this.loadReview();
      if (this.fundsFor) this.loadNodeFunds(this.fundsPage);
    };
    ids.forEach(id => {
      this.api.assignFundToNode(id, node.id).subscribe({
        next: () => { done++; finish(); },
        error: () => { failed++; finish(); }
      });
    });
  }

  bulkReset(): void {
    const ids = [...this.checkedFunds];
    if (!ids.length || !this.fundsFor) return;
    this.api.bulkRemoveFundsFromNode(this.fundsFor.id, ids, null, true).subscribe({
      next: () => { this.toast.show('أُعيد المحدد للتلقائي'); this.checkedFunds.clear(); this.loadNodeFunds(this.fundsPage); this.loadTree(); },
      error: () => this.toast.show('فشلت الإعادة')
    });
  }

  // ── review ──
  loadReview(): void {
    this.reviewLoading = true;
    this.api.getClassificationReview().subscribe({
      next: (r) => { this.review = r; this.reviewLoading = false; },
      error: () => { this.reviewLoading = false; }
    });
  }

  toggleReviewCheck(id: number, checked: boolean): void {
    if (checked) this.checkedReview.add(id);
    else this.checkedReview.delete(id);
  }

  allReviewChecked(which: string): boolean {
    const list = which === 'u' ? this.review?.unclassifiedEquity ?? [] : [];
    return list.length > 0 && list.every(r => this.checkedReview.has(r.fundId));
  }

  toggleAllReview(which: string, checked: boolean): void {
    const list = which === 'u' ? this.review?.unclassifiedEquity ?? [] : [];
    for (const r of list) {
      if (checked) this.checkedReview.add(r.fundId);
      else this.checkedReview.delete(r.fundId);
    }
  }

  // ── change log ──
  loadLog(page = 1): void {
    this.logLoading = true;
    this.logPage = page;
    this.api.getClassificationChanges(page, 50).subscribe({
      next: (res) => { this.changeLog = res.items || []; this.logTotalPages = res.totalPages || 0; this.logLoading = false; },
      error: () => { this.logLoading = false; }
    });
  }

  // ── generic confirm ──
  runConfirm(): void {
    const action = this.confirmBox?.run;
    this.confirmBox = null;
    action?.();
  }
}