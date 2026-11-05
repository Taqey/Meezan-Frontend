import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Edit3 as EditIcon, Undo2 as UndoIcon, Plus as PlusIcon } from 'lucide-angular';
import { AdminClassificationTreeService } from '../../services/admin-classification-tree.service';
import { AdminClassificationFundsService } from '../../services/admin-classification-funds.service';

@Component({
  selector: 'app-admin-classification-tree-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './admin-classification-tree-tab.component.html',
  styleUrl: './admin-classification-tree-tab.component.css'
})
export class AdminClassificationTreeTabComponent {
  readonly EditIcon = EditIcon;
  readonly UndoIcon = UndoIcon;
  readonly PlusIcon = PlusIcon;
  constructor(public tree: AdminClassificationTreeService, public funds: AdminClassificationFundsService) {}
}
