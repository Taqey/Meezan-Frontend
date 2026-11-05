import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, RefreshCw as RefreshIcon } from 'lucide-angular';
import { AdminFundCategoriesService } from '../../services/admin-fund-categories.service';

@Component({
  selector: 'app-admin-funds-change-log-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './admin-funds-change-log-tab.component.html',
  styleUrl: './admin-funds-change-log-tab.component.css'
})
export class AdminFundsChangeLogTabComponent {
  readonly RefreshIcon = RefreshIcon;
  constructor(public categories: AdminFundCategoriesService) {}
}
