import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminShariahOverridesService } from '../../services/admin-shariah-overrides.service';
import { AdminStockLookupService } from '../../services/admin-stock-lookup.service';
import { StockPickerComponent } from '../../../../shared/components/stock-picker/stock-picker.component';
import { StockHeaderBannerComponent } from '../../../../shared/components/stock-header-banner/stock-header-banner.component';
import { ShariahOverridesPanelComponent } from '../../components/shariah-overrides-panel/shariah-overrides-panel.component';
import { BourseHalalStandardsTableComponent } from '../../components/bourse-halal-standards-table/bourse-halal-standards-table.component';

@Component({
  selector: 'app-admin-shariah-edit-page',
  standalone: true,
  imports: [
    CommonModule,
    StockPickerComponent,
    StockHeaderBannerComponent,
    ShariahOverridesPanelComponent,
    BourseHalalStandardsTableComponent
  ],
  templateUrl: './admin-shariah-edit-page.component.html',
  styleUrl: './admin-shariah-edit-page.component.css'
})
export class AdminShariahEditPageComponent implements OnInit {
  constructor(
    public overrides: AdminShariahOverridesService,
    public lookup: AdminStockLookupService
  ) {}

  ngOnInit(): void {
    this.lookup.loadStocks();
  }
}
