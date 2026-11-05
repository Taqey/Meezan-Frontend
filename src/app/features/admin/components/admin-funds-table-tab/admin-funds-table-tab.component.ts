import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search as SearchIcon, Edit3 as EditIcon, RefreshCw as RefreshIcon, X as XIcon, Undo2 as UndoIcon, Save as SaveIcon, RotateCcw as RotateIcon } from 'lucide-angular';
import { AdminFundDetailsService } from '../../services/admin-fund-details.service';

@Component({
  selector: 'app-admin-funds-table-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './admin-funds-table-tab.component.html',
  styleUrl: './admin-funds-table-tab.component.css'
})
export class AdminFundsTableTabComponent {
  readonly SearchIcon = SearchIcon;
  readonly EditIcon = EditIcon;
  readonly RefreshIcon = RefreshIcon;
  readonly XIcon = XIcon;
  readonly UndoIcon = UndoIcon;
  readonly SaveIcon = SaveIcon;
  readonly RotateIcon = RotateIcon;
  constructor(public funds: AdminFundDetailsService) {}
}
