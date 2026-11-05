import { Injectable } from '@angular/core';
import { ApiService } from '../../../core/api/api.service';
import { ClassificationReview, ClassificationReviewRow } from '../../../shared/models/api.models';
@Injectable({ providedIn: 'root' })
export class AdminClassificationReviewService {
  constructor(private api: ApiService) {}
  review: ClassificationReview | null = null;

  reviewLoading = false;

  get reviewBadge(): number {
    return (this.review?.unclassifiedCount ?? 0) + (this.review?.conflictingCount ?? 0) + (this.review?.missingChildCount ?? 0);
  }

  checkedReview = new Set<number>();

  trackReview = (_: number, r: { fundId: number }) => r.fundId;

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
}
