import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, LineChart, X, History } from 'lucide-angular';
import { AdminFundCompareService } from '../../services/admin-fund-compare.service';
import { AdminFundsSyncService } from '../../services/admin-funds-sync.service';

@Component({
  selector: 'app-fund-compare-chart-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './fund-compare-chart-modal.component.html',
  styleUrl: './fund-compare-chart-modal.component.css'
})
export class FundCompareChartModalComponent {
  readonly LineChartIcon = LineChart;
  readonly XIcon = X;
  readonly HistoryIcon = History;
  constructor(public compare: AdminFundCompareService, public fundsSync: AdminFundsSyncService) {}
}
