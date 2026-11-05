import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { type MzStat } from '../models/mz-stat.model';

@Component({
  selector: 'mz-stat-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  host: { class: 'mz', style: 'display:block' },
  templateUrl: './mz-stat-card.component.html',
})
export class MzStatCardComponent {
  @Input() stat!: MzStat;
}
