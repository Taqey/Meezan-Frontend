import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { AdminPageHeadingComponent } from '../components/admin-page-heading/admin-page-heading.component';
import { AdminScrapingPageComponent } from '../pages/admin-scraping-page/admin-scraping-page.component';
import { AdminMarketDataPageComponent } from '../pages/admin-market-data-page/admin-market-data-page.component';
import { AdminShariahEditPageComponent } from '../pages/admin-shariah-edit-page/admin-shariah-edit-page.component';
import { AdminIndexUploadPageComponent } from '../pages/admin-index-upload-page/admin-index-upload-page.component';
import { AdminShariahSeedPageComponent } from '../pages/admin-shariah-seed-page/admin-shariah-seed-page.component';
import { AdminPdfReportsPageComponent } from '../pages/admin-pdf-reports-page/admin-pdf-reports-page.component';
import { AdminReviewChecklistPageComponent } from '../pages/admin-review-checklist-page/admin-review-checklist-page.component';
import { AdminStocksMgmtPageComponent } from '../pages/admin-stocks-mgmt-page/admin-stocks-mgmt-page.component';

/**
 * Admin operations dashboard coordinator.
 * Delegates individual operation workflows to dedicated, single-responsibility
 * page and feature components based on the active route tab.
 */
@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    AdminPageHeadingComponent,
    AdminScrapingPageComponent,
    AdminMarketDataPageComponent,
    AdminShariahEditPageComponent,
    AdminIndexUploadPageComponent,
    AdminShariahSeedPageComponent,
    AdminPdfReportsPageComponent,
    AdminReviewChecklistPageComponent,
    AdminStocksMgmtPageComponent
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit, OnDestroy {
  activeTab: 'scraping' | 'market-data' | 'upload' | 'shariah' | 'pdf-upload' | 'review' | 'stocks' | 'shariah-edit' = 'scraping';
  private routeSub?: Subscription;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.routeSub = this.route.data.subscribe((data) => {
      const tab = data['tab'];
      if (
        tab === 'scraping' ||
        tab === 'market-data' ||
        tab === 'upload' ||
        tab === 'shariah' ||
        tab === 'pdf-upload' ||
        tab === 'review' ||
        tab === 'stocks' ||
        tab === 'shariah-edit'
      ) {
        this.activeTab = tab;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routeSub) this.routeSub.unsubscribe();
  }
}
