import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, RefreshCw as RefreshIcon, Plus as PlusIcon, Edit3 as EditIcon, Undo2 as UndoIcon, RotateCcw as RotateIcon, X as XIcon } from 'lucide-angular';
import { AdminFundCategoriesService } from '../../services/admin-fund-categories.service';

@Component({
  selector: 'app-admin-funds-categories-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './admin-funds-categories-tab.component.html',
  styleUrl: './admin-funds-categories-tab.component.css'
})
export class AdminFundsCategoriesTabComponent {
  readonly RefreshIcon = RefreshIcon;
  readonly PlusIcon = PlusIcon;
  readonly EditIcon = EditIcon;
  readonly UndoIcon = UndoIcon;
  readonly RotateIcon = RotateIcon;
  readonly XIcon = XIcon;
  constructor(public categories: AdminFundCategoriesService) {}
}
