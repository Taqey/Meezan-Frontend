import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  Sparkles,
  ArrowLeft,
  ChevronLeft,
  ShieldCheck,
  CircleHelp,
  LineChart
} from 'lucide-angular';
import { ApiService } from '../../../core/api/api.service';
import { MzListingCardComponent } from '../../../shared/components/ui/mz-listing-card/mz-listing-card.component';
import { type MzListingCardData } from '../../../shared/components/ui/models/mz-listing-card-data.model';
import { stockToCard } from '../../../shared/components/ui/mappers/stock-to-card.util';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { CountUpDirective } from '../../../shared/directives/count-up.directive';
import { RevealDirective } from '../../../shared/directives/reveal.directive';
import { IndexSummaryDto, StockListItemDto } from '../../../shared/models/api.models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, MzListingCardComponent, StatusBadgeComponent, CountUpDirective, RevealDirective],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  readonly SparklesIcon = Sparkles;
  readonly ArrowLeftIcon = ArrowLeft;
  readonly ChevronLeftIcon = ChevronLeft;
  readonly ShieldCheckIcon = ShieldCheck;
  readonly CircleHelpIcon = CircleHelp;
  readonly LineChartIcon = LineChart;

  totalStocksCount = 0;
  indicesCount = 8;
  topStocks: StockListItemDto[] = [];
  topCards: MzListingCardData[] = [];
  trackCard = (_: number, c: MzListingCardData) => c.id;
  loading = true;

  sampleSources = [
    { name: 'مصفّى (Musaffa)', status: 'Compliant' },
    { name: 'كاشف (Kashif)', status: 'Compliant' },
    { name: 'بورصة حلال (Halal Bourse)', status: 'Pending' },
    { name: 'ثندر (Thndr)', status: 'Compliant' },
    { name: 'بنك فيصل الإسلامي', status: 'Compliant' },
    { name: 'أسطول (Ostoul)', status: 'Compliant' },
    { name: 'حلال إنفست (Halal Invest)', status: 'Compliant' }
  ];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.api.getStocks({ page: 1, pageSize: 9, sortBy: 'changePct', sortDir: 'desc' }).subscribe({
      next: (res) => {
        this.topStocks = (res.items || []).slice(0, 9);
        this.topCards = this.topStocks.map((s) => stockToCard(s));
        this.totalStocksCount = res.totalCount || 0;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });

    this.api.getIndices().subscribe({
      next: (indices) => {
        if (indices?.length) {
          this.indicesCount = indices.length;
        }
      }
    });
  }
}
