import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, RefreshCw } from 'lucide-angular';
import { AdminStocksManagementService } from '../../services/admin-stocks-management.service';
import { CreateStockFormComponent } from '../../components/create-stock-form/create-stock-form.component';
import { StocksManagementTableComponent } from '../../components/stocks-management-table/stocks-management-table.component';

@Component({
  selector: 'app-admin-stocks-mgmt-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, CreateStockFormComponent, StocksManagementTableComponent],
  templateUrl: './admin-stocks-mgmt-page.component.html',
  styleUrl: './admin-stocks-mgmt-page.component.css'
})
export class AdminStocksMgmtPageComponent implements OnInit {
  readonly SearchIcon = Search;
  readonly RefreshCwIcon = RefreshCw;
  constructor(public mgmt: AdminStocksManagementService) {}
  ngOnInit(): void { this.mgmt.loadMgmtData(); }
}
