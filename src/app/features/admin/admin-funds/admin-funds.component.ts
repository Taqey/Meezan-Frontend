import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, PiggyBank } from 'lucide-angular';
import { AdminClassificationComponent } from '../admin-classification/admin-classification.component';
import { AdminFundsSyncLogService } from '../services/admin-funds-sync-log.service';
import { AdminFundCategoriesService } from '../services/admin-fund-categories.service';
import { AdminFundDetailsService } from '../services/admin-fund-details.service';
import { AdminFundsSyncTabComponent } from '../components/admin-funds-sync-tab/admin-funds-sync-tab.component';
import { AdminFundsCategoriesTabComponent } from '../components/admin-funds-categories-tab/admin-funds-categories-tab.component';
import { AdminFundsTableTabComponent } from '../components/admin-funds-table-tab/admin-funds-table-tab.component';
import { AdminFundsChangeLogTabComponent } from '../components/admin-funds-change-log-tab/admin-funds-change-log-tab.component';
import { AdminFundsModalsComponent } from '../components/admin-funds-modals/admin-funds-modals.component';

/**
 * Admin funds management coordinator.
 * Orchestrates sub-sections: Classification, Categories, Funds, Sync History, and Change Log.
 */
@Component({
  selector: 'app-admin-funds',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    AdminClassificationComponent,
    AdminFundsSyncTabComponent,
    AdminFundsCategoriesTabComponent,
    AdminFundsTableTabComponent,
    AdminFundsChangeLogTabComponent,
    AdminFundsModalsComponent
  ],
  templateUrl: './admin-funds.component.html',
  styleUrl: './admin-funds.component.css'
})
export class AdminFundsComponent implements OnInit {
  readonly PiggyBankIcon = PiggyBank;

  section: 'sync' | 'categories' | 'classification' | 'funds' | 'log' = 'classification';

  constructor(
    public sync: AdminFundsSyncLogService,
    public categories: AdminFundCategoriesService,
    public funds: AdminFundDetailsService
  ) {}

  ngOnInit(): void {
    this.categories.loadCategories();
  }

  onSelectSection(sec: 'sync' | 'categories' | 'classification' | 'funds' | 'log'): void {
    this.section = sec;
    if (sec === 'funds') this.funds.searchAdminFunds();
    if (sec === 'sync') this.sync.loadSyncHistory();
    if (sec === 'log') this.categories.loadChangeLog();
    if (sec === 'categories') this.categories.loadCategories();
  }
}
