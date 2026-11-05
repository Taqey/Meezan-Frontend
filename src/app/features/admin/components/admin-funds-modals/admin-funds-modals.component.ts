import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, X as XIcon, Save as SaveIcon } from 'lucide-angular';
import { AdminFundCategoriesService } from '../../services/admin-fund-categories.service';

@Component({
  selector: 'app-admin-funds-modals',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './admin-funds-modals.component.html',
  styleUrl: './admin-funds-modals.component.css'
})
export class AdminFundsModalsComponent {
  readonly XIcon = XIcon;
  readonly SaveIcon = SaveIcon;
  constructor(public categories: AdminFundCategoriesService) {}
}
