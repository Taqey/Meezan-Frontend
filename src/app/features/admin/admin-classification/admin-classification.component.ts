import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, RefreshCw } from 'lucide-angular';
import { AdminClassificationTreeService } from '../services/admin-classification-tree.service';
import { AdminClassificationReviewService } from '../services/admin-classification-review.service';
import { AdminClassificationFundsService } from '../services/admin-classification-funds.service';
import { AdminClassificationTreeTabComponent } from '../components/admin-classification-tree-tab/admin-classification-tree-tab.component';
import { AdminClassificationReviewTabComponent } from '../components/admin-classification-review-tab/admin-classification-review-tab.component';
import { AdminClassificationFundsPanelComponent } from '../components/admin-classification-funds-panel/admin-classification-funds-panel.component';
import { AdminClassificationModalsComponent } from '../components/admin-classification-modals/admin-classification-modals.component';

/**
 * Admin classification coordinator.
 * Manages view switching between Tree, Needs-Review, and Change Log tabs,
 * delegating tree mutations, review workflows, and fund memberships to domain services.
 */
@Component({
  selector: 'app-admin-classification',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    AdminClassificationTreeTabComponent,
    AdminClassificationReviewTabComponent,
    AdminClassificationFundsPanelComponent,
    AdminClassificationModalsComponent
  ],
  templateUrl: './admin-classification.component.html',
  styleUrl: './admin-classification.component.css'
})
export class AdminClassificationComponent implements OnInit {
  readonly RefreshIcon = RefreshCw;

  view: 'tree' | 'review' | 'log' = 'tree';

  constructor(
    public tree: AdminClassificationTreeService,
    public review: AdminClassificationReviewService,
    public funds: AdminClassificationFundsService
  ) {}

  ngOnInit(): void {
    this.tree.refreshAll();
  }

  onSelectView(v: 'tree' | 'review' | 'log'): void {
    this.view = v;
    if (v === 'review') this.review.loadReview();
  }
}
