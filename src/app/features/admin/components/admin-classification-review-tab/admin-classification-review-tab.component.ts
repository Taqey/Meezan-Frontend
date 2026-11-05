import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, RefreshCw as RefreshIcon } from 'lucide-angular';
import { AdminClassificationReviewService } from '../../services/admin-classification-review.service';
import { AdminClassificationTreeService } from '../../services/admin-classification-tree.service';
import { AdminClassificationFundsService } from '../../services/admin-classification-funds.service';
import { ClassificationCascadeComponent } from '../../../../shared/components/classification-cascade/classification-cascade.component';

@Component({
  selector: 'app-admin-classification-review-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, ClassificationCascadeComponent],
  templateUrl: './admin-classification-review-tab.component.html',
  styleUrl: './admin-classification-review-tab.component.css'
})
export class AdminClassificationReviewTabComponent {
  readonly RefreshIcon = RefreshIcon;
  readonly emptyPath: string[] = [];
  constructor(public review: AdminClassificationReviewService, public tree: AdminClassificationTreeService, public funds: AdminClassificationFundsService) {}
}
