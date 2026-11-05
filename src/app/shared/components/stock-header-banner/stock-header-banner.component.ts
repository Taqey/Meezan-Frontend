import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarketDataDto } from '../../models/api.models';

@Component({
  selector: 'app-stock-header-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stock-header-banner.component.html',
  styleUrl: './stock-header-banner.component.css'
})
export class StockHeaderBannerComponent {
  @Input() stockMarketData!: MarketDataDto;
}
