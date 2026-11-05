import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingSkeletonsComponent } from '../../loading-skeletons/loading-skeletons.component';
import { MzStatCardComponent } from '../mz-stat-card/mz-stat-card.component';
import { type MzStat } from '../models/mz-stat.model';

/* ───────────── StatsRow ───────────── */
@Component({
  selector: 'mz-stats-row',
  standalone: true,
  imports: [CommonModule, MzStatCardComponent, LoadingSkeletonsComponent],
  host: { class: 'mz', style: 'display:block' },
  templateUrl: './mz-stats-row.component.html',
  styleUrl: './mz-stats-row.component.css',
})
export class MzStatsRowComponent {
  @Input() stats: MzStat[] = [];
  @Input() loading = false;
  @Input() count = 4;

  trackStat(index: number, s: MzStat): string {
    return s.label || String(index);
  }
}
