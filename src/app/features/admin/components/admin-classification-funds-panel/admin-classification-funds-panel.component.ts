import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, X as XIcon, RefreshCw as RefreshIcon, Plus as PlusIcon } from 'lucide-angular';
import { AdminClassificationFundsService } from '../../services/admin-classification-funds.service';
import { AdminClassificationTreeService } from '../../services/admin-classification-tree.service';
import { ClassificationCascadeComponent } from '../../../../shared/components/classification-cascade/classification-cascade.component';

@Component({
  selector: 'app-admin-classification-funds-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, ClassificationCascadeComponent],
  templateUrl: './admin-classification-funds-panel.component.html',
  styleUrl: './admin-classification-funds-panel.component.css'
})
export class AdminClassificationFundsPanelComponent {
  readonly XIcon = XIcon;
  readonly RefreshIcon = RefreshIcon;
  readonly PlusIcon = PlusIcon;
  readonly emptyPath: string[] = [];
  constructor(public funds: AdminClassificationFundsService, public tree: AdminClassificationTreeService) {}
}
