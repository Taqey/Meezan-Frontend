import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, type LucideIconData } from 'lucide-angular';

export interface KpiData {
  icon: LucideIconData;
  value: string;
  sub?: string | null;
  label: string;
}

/** KPI strip: icon + big value + label cards, with skeleton placeholders. */
@Component({
  selector: 'app-kpi-strip',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './kpi-strip.component.html',
})
export class KpiStripComponent {
  @Input() kpis: KpiData[] = [];
  @Input() loading = false;
}
