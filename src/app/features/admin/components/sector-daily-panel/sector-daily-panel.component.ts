import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Layers, RotateCcw } from 'lucide-angular';
import { AdminSectorDailyService } from '../../services/admin-sector-daily.service';

@Component({
  selector: 'app-sector-daily-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './sector-daily-panel.component.html',
  styleUrl: './sector-daily-panel.component.css'
})
export class SectorDailyPanelComponent {
  readonly LayersIcon = Layers;
  readonly RotateCcwIcon = RotateCcw;
  constructor(public sectorDaily: AdminSectorDailyService) {}
}
