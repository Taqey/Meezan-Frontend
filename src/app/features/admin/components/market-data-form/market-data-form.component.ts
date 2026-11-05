import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Save, RotateCcw } from 'lucide-angular';
import { AdminMarketDataService } from '../../services/admin-market-data.service';

@Component({
  selector: 'app-market-data-form',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './market-data-form.component.html',
  styleUrl: './market-data-form.component.css'
})
export class MarketDataFormComponent {
  readonly SaveIcon = Save;
  readonly RotateCcwIcon = RotateCcw;
  constructor(public marketData: AdminMarketDataService) {}
}
