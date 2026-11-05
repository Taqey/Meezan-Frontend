import { Injectable } from '@angular/core';
import { ApiService } from '../../../core/api/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { AdminClassificationTreeService } from './admin-classification-tree.service';
import { AdminClassificationReviewService } from './admin-classification-review.service';
import { AdminClassificationNode, ClassificationNodeFundRow } from '../../../shared/models/api.models';
@Injectable({ providedIn: 'root' })
export class AdminClassificationFundsService {
  constructor(
    private api: ApiService,
    private toast: ToastService,
    private tree: AdminClassificationTreeService,
    private review: AdminClassificationReviewService
  ) {
    this.tree.onReclassifyDone = () => { if (this.fundsFor) this.loadNodeFunds(1); };
  }
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

  get bulkMoveCount(): number { return this.checkedFunds.size + this.review.checkedReview.size; }

  trackFund = (_: number, m: { id: number }) => m.id;

  sourceAr(s: string): string {
    return s === 'Manual' ? 'يدوي' : s === 'Auto' ? 'تلقائي' : s === 'SNDUK' ? 'SNDUK' : s;
  }

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
      next: () => { this.toast.show('أُعيد للتلقائي'); this.loadNodeFunds(this.fundsPage); this.tree.loadTree(); },
      error: () => this.toast.show('تعذّرت الإعادة')
    });
  }

  assignFromCascade(fundId: number, path: string[]): void {
    if (!path.length) return;
    const slug = path[path.length - 1];
    const node = this.tree.tree.find(n => n.slug === slug);
    if (!node) return;
    this.api.assignFundToNode(fundId, node.id).subscribe({
      next: () => { this.toast.show('تم التعيين اليدوي'); this.loadNodeFunds(this.fundsPage); this.tree.loadTree(); this.review.loadReview(); },
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
        this.tree.loadTree();
      },
      error: () => this.toast.show('فشلت الإضافة')
    });
  }

  confirmBulkMove(): void {
    if (!this.bulkMovePath.length) return;
    const slug = this.bulkMovePath[this.bulkMovePath.length - 1];
    const node = this.tree.tree.find(n => n.slug === slug);
    if (!node) return;
    const ids = [...new Set([...this.checkedFunds, ...this.review.checkedReview])];
    let done = 0, failed = 0;
    const finish = () => {
      if (done + failed < ids.length) return;
      this.toast.show(failed ? `نُقل ${done} وفشل ${failed}` : `نُقل ${done}`);
      this.bulkMoveOpen = false;
      this.bulkMovePath = [];
      this.checkedFunds.clear();
      this.review.checkedReview.clear();
      this.tree.loadTree();
      this.review.loadReview();
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
      next: () => { this.toast.show('أُعيد المحدد للتلقائي'); this.checkedFunds.clear(); this.loadNodeFunds(this.fundsPage); this.tree.loadTree(); },
      error: () => this.toast.show('فشلت الإعادة')
    });
  }

  closeFunds(): void { this.fundsFor = null; this.fundsItems = []; }
}
