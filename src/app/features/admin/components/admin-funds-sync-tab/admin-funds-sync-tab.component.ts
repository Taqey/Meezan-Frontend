import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminFundsSyncLogService } from '../../services/admin-funds-sync-log.service';

@Component({
  selector: 'app-admin-funds-sync-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-funds-sync-tab.component.html',
  styleUrl: './admin-funds-sync-tab.component.css'
})
export class AdminFundsSyncTabComponent {
  constructor(public sync: AdminFundsSyncLogService) {}
}
