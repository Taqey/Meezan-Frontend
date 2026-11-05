import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search } from 'lucide-angular';
import { AdminStockLookupItem } from '../../models/api.models';

@Component({
  selector: 'app-stock-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './stock-picker.component.html',
  styleUrl: './stock-picker.component.css'
})
export class StockPickerComponent {
  readonly SearchIcon = Search;
  @Input() filteredStocks: AdminStockLookupItem[] = [];
  @Input() searchQuery = '';
  @Input() selectedTicker = '';
  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() selectedTickerChange = new EventEmitter<string>();
  @Output() searchInput = new EventEmitter<void>();
  @Output() stockSelected = new EventEmitter<void>();
  @Output() directSelect = new EventEmitter<string>();
}
