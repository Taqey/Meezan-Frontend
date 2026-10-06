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
  template: `
    <div class="kpi-grid" *ngIf="loading">
      <div class="kpi-card" *ngFor="let n of [1, 2, 3]" aria-hidden="true">
        <div class="sk-line sk-text"></div>
        <div class="sk-line sk-price"></div>
      </div>
    </div>
    <div class="kpi-grid" *ngIf="!loading">
      <div class="kpi-card" *ngFor="let k of kpis">
        <span class="kpi-icon"><lucide-icon [img]="k.icon" size="18"></lucide-icon></span>
        <div>
          <strong>{{ k.value }} <small *ngIf="k.sub">{{ k.sub }}</small></strong>
          <span>{{ k.label }}</span>
        </div>
      </div>
    </div>
  `
})
export class KpiStripComponent {
  @Input() kpis: KpiData[] = [];
  @Input() loading = false;
}
