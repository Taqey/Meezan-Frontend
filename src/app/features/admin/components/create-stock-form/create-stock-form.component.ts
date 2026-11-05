import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminStocksManagementService } from '../../services/admin-stocks-management.service';

@Component({
  selector: 'app-create-stock-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-stock-form.component.html',
  styleUrl: './create-stock-form.component.css'
})
export class CreateStockFormComponent {
  constructor(public mgmt: AdminStocksManagementService) {}
}
