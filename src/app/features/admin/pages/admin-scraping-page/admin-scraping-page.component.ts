import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Clock, Calendar } from 'lucide-angular';
import { AdminScrapingJobsService } from '../../services/admin-scraping-jobs.service';
import { AdminFundsSyncService } from '../../services/admin-funds-sync.service';
import { JobCardComponent } from '../../components/job-card/job-card.component';
import { FundsSyncCardComponent } from '../../components/funds-sync-card/funds-sync-card.component';
import { ScrapeProgressComponent } from '../../components/scrape-progress/scrape-progress.component';
import { SectorDailyPanelComponent } from '../../components/sector-daily-panel/sector-daily-panel.component';
import { LastRunTableComponent } from '../../components/last-run-table/last-run-table.component';
import { HistoricalSyncModalComponent } from '../../components/historical-sync-modal/historical-sync-modal.component';
import { FundCompareChartModalComponent } from '../../components/fund-compare-chart-modal/fund-compare-chart-modal.component';

@Component({
  selector: 'app-admin-scraping-page',
  standalone: true,
  imports: [
    CommonModule,
    JobCardComponent,
    FundsSyncCardComponent,
    ScrapeProgressComponent,
    SectorDailyPanelComponent,
    LastRunTableComponent,
    HistoricalSyncModalComponent,
    FundCompareChartModalComponent
  ],
  templateUrl: './admin-scraping-page.component.html',
  styleUrl: './admin-scraping-page.component.css'
})
export class AdminScrapingPageComponent implements OnInit, OnDestroy {
  readonly ClockIcon = Clock;
  readonly CalendarIcon = Calendar;
  private pollInterval?: any;

  constructor(
    public jobs: AdminScrapingJobsService,
    public fundsSync: AdminFundsSyncService
  ) {}

  ngOnInit(): void {
    this.jobs.fetchScrapeStatus();
    this.fundsSync.fetchFundSyncStatus();
    this.jobs.loadJobSettings();
    this.fundsSync.loadFundSyncSettings();
    this.fundsSync.loadFundSyncHistory();
    this.fundsSync.loadAdminFundPickerList();
    this.pollInterval = setInterval(() => {
      this.jobs.fetchScrapeStatus();
      this.fundsSync.fetchFundSyncStatus();
    }, 2000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }
}
