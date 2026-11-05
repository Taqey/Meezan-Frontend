import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Database, Play, RotateCcw, History, Search, LineChart } from 'lucide-angular';
import { AdminFundsSyncService } from '../../services/admin-funds-sync.service';
import { AdminHistoricalSyncService } from '../../services/admin-historical-sync.service';
import { AdminFundCompareService } from '../../services/admin-fund-compare.service';

@Component({
  selector: 'app-funds-sync-card',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, RouterLink],
  templateUrl: './funds-sync-card.component.html',
  styleUrl: './funds-sync-card.component.css'
})
export class FundsSyncCardComponent {
  readonly DatabaseIcon = Database;
  readonly PlayIcon = Play;
  readonly RotateCcwIcon = RotateCcw;
  readonly HistoryIcon = History;
  readonly SearchIcon = Search;
  readonly LineChartIcon = LineChart;
  constructor(public fundsSync: AdminFundsSyncService, public historical: AdminHistoricalSyncService, public compare: AdminFundCompareService) {}
  // Host flex styling in CSS
}
