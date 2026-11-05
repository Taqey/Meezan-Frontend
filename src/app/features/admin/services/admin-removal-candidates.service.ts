import { Injectable } from '@angular/core';
import { ApiService } from '../../../core/api/api.service';
import { RemovalCandidateDto, RefreshSelectedStocksResult } from '../../../shared/models/api.models';

@Injectable({ providedIn: 'root' })
export class AdminRemovalCandidatesService {
  constructor(
    private api: ApiService
  ) {}

  // Review checklist tab
  removalCandidates: RemovalCandidateDto[] = [];

  selectedTickers = new Set<string>();

  candidatesLoading = false;

  candidatesBusy = false;

  candidatesMessage = '';

  candidatesError = false;

  refreshSelectedResult?: RefreshSelectedStocksResult;

  loadRemovalCandidates(): void {
    this.candidatesLoading = true;
    this.candidatesMessage = '';
    this.candidatesError = false;
    this.api.getRemovalCandidates().subscribe({
      next: (rows) => {
        this.removalCandidates = rows || [];
        // Drop selections for tickers that are no longer candidates.
        this.selectedTickers = new Set(
          [...this.selectedTickers].filter((t) => this.removalCandidates.some((c) => c.ticker === t))
        );
        this.candidatesLoading = false;
      },
      error: () => {
        this.candidatesLoading = false;
        this.candidatesError = true;
        this.candidatesMessage = 'تعذّر تحميل قائمة المراجعة.';
      }
    });
  }

  toggleCandidate(ticker: string, checked: boolean): void {
    if (checked) this.selectedTickers.add(ticker);
    else this.selectedTickers.delete(ticker);
    this.selectedTickers = new Set(this.selectedTickers);
  }

  get allCandidatesSelected(): boolean {
    return this.removalCandidates.length > 0 && this.selectedTickers.size === this.removalCandidates.length;
  }

  toggleSelectAllCandidates(checked: boolean): void {
    this.selectedTickers = checked
      ? new Set(this.removalCandidates.map((c) => c.ticker))
      : new Set<string>();
  }

  refreshSelectedCandidates(): void {
    const tickers = [...this.selectedTickers];
    if (!tickers.length) return;
    this.candidatesBusy = true;
    this.candidatesMessage = '';
    this.candidatesError = false;
    this.refreshSelectedResult = undefined;
    this.api.refreshSelectedStocks(tickers).subscribe({
      next: (res) => {
        this.candidatesBusy = false;
        this.refreshSelectedResult = res;
        this.candidatesError = !res.success;
        this.candidatesMessage = `اكتملت إعادة السحب: نجح ${res.succeeded} وفشل ${res.failed} من ${res.totalRequested}.`
          + (res.errorSummary ? ` — ${res.errorSummary}` : '');
        this.loadRemovalCandidates();
      },
      error: () => {
        this.candidatesBusy = false;
        this.candidatesError = true;
        this.candidatesMessage = 'تعذّر تنفيذ إعادة السحب للأسهم المحددة.';
      }
    });
  }

  confirmSelectedCandidates(): void {
    const tickers = [...this.selectedTickers];
    if (!tickers.length) return;
    if (!confirm(`تأكيد إيقاف ${tickers.length} سهم؟ (يتم الإيقاف فقط مع الاحتفاظ بالبيانات)`)) return;
    this.candidatesBusy = true;
    this.candidatesMessage = '';
    this.candidatesError = false;
    this.api.confirmRemovals(tickers, 'تم الإيقاف يدوياً عبر قائمة المراجعة').subscribe({
      next: (res) => {
        this.candidatesBusy = false;
        this.candidatesMessage = res.message;
        this.selectedTickers = new Set<string>();
        this.loadRemovalCandidates();
      },
      error: () => {
        this.candidatesBusy = false;
        this.candidatesError = true;
        this.candidatesMessage = 'تعذّر تأكيد الإيقاف.';
      }
    });
  }

  reactivateSelectedCandidates(): void {
    const tickers = [...this.selectedTickers];
    if (!tickers.length) return;
    this.candidatesBusy = true;
    this.candidatesMessage = '';
    this.candidatesError = false;
    this.api.reactivateSelectedStocks(tickers).subscribe({
      next: (res) => {
        this.candidatesBusy = false;
        this.candidatesMessage = res.message;
        this.selectedTickers = new Set<string>();
        this.loadRemovalCandidates();
      },
      error: () => {
        this.candidatesBusy = false;
        this.candidatesError = true;
        this.candidatesMessage = 'تعذّر إعادة التفعيل.';
      }
    });
  }

  reasonLabel(reason: string): string {
    switch (reason) {
      case 'StaleData': return 'بيانات قديمة';
      case 'NotFoundOnSource': return 'غير موجود في المصدر';
      case 'Deactivated': return 'معطَّل يدوياً';
      default: return reason;
    }
  }
}
