import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, History, X, RotateCcw, Search, CheckCircle, AlertTriangle } from 'lucide-angular';
import { AdminHistoricalSyncService } from '../../services/admin-historical-sync.service';
import { AdminFundsSyncService } from '../../services/admin-funds-sync.service';
import { AdminFundCompareService } from '../../services/admin-fund-compare.service';

@Component({
  selector: 'app-historical-sync-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './historical-sync-modal.component.html',
  styleUrl: './historical-sync-modal.component.css'
})
export class HistoricalSyncModalComponent {
  readonly HistoryIcon = History;
  readonly XIcon = X;
  readonly RotateCcwIcon = RotateCcw;
  readonly SearchIcon = Search;
  readonly CheckCircleIcon = CheckCircle;
  readonly AlertTriangleIcon = AlertTriangle;
  constructor(public historical: AdminHistoricalSyncService, public fundsSync: AdminFundsSyncService, public compare: AdminFundCompareService) {}
}
