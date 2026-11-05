import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, X as XIcon, Save as SaveIcon } from 'lucide-angular';
import { AdminClassificationTreeService } from '../../services/admin-classification-tree.service';
import { AdminClassificationFundsService } from '../../services/admin-classification-funds.service';
import { AdminClassificationReviewService } from '../../services/admin-classification-review.service';
import { ClassificationCascadeComponent } from '../../../../shared/components/classification-cascade/classification-cascade.component';

@Component({
  selector: 'app-admin-classification-modals',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, ClassificationCascadeComponent],
  templateUrl: './admin-classification-modals.component.html',
  styleUrl: './admin-classification-modals.component.css'
})
export class AdminClassificationModalsComponent {
  readonly XIcon = XIcon;
  readonly SaveIcon = SaveIcon;
  readonly emptyPath: string[] = [];
  constructor(public tree: AdminClassificationTreeService, public funds: AdminClassificationFundsService, public review: AdminClassificationReviewService) {}
}
