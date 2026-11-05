import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminMarketDataService } from '../../services/admin-market-data.service';
import { AdminStockLookupService } from '../../services/admin-stock-lookup.service';
import { StockPickerComponent } from '../../../../shared/components/stock-picker/stock-picker.component';
import { StockHeaderBannerComponent } from '../../../../shared/components/stock-header-banner/stock-header-banner.component';
import { MarketDataFormComponent } from '../../components/market-data-form/market-data-form.component';

@Component({
  selector: 'app-admin-market-data-page',
  standalone: true,
  imports: [
    CommonModule,
    StockPickerComponent,
    StockHeaderBannerComponent,
    MarketDataFormComponent
  ],
  templateUrl: './admin-market-data-page.component.html',
  styleUrl: './admin-market-data-page.component.css'
})
export class AdminMarketDataPageComponent implements OnInit {
  constructor(
    public marketData: AdminMarketDataService,
    public lookup: AdminStockLookupService
  ) {}

  ngOnInit(): void {
    this.lookup.loadStocks();
  }
}
