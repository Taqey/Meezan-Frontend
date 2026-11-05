import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminStocksManagementService } from '../../services/admin-stocks-management.service';

@Component({
  selector: 'app-stocks-management-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stocks-management-table.component.html',
  styleUrl: './stocks-management-table.component.css'
})
export class StocksManagementTableComponent {
  constructor(public mgmt: AdminStocksManagementService) {}
}
