import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Clock, Play, RotateCcw } from 'lucide-angular';

@Component({
  selector: 'app-job-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './job-card.component.html',
  styleUrl: './job-card.component.css'
})
export class JobCardComponent {
  readonly PlayIcon = Play;
  readonly RotateCcwIcon = RotateCcw;
  @Input() icon: any = Clock;
  @Input() title = '';
  @Input() description = '';
  @Input() scheduleText = '';
  @Input() lastRunText = '';
  @Input() accentColor = 'var(--primary)';
  @Input() enabledBg = '#f0fdf4';
  @Input() enabledBorder = '#bbf7d0';
  @Input() enabledTextColor = '#166534';
  @Input() enabledBtnColor = '#16a34a';
  @Input() enabledSubText = '';
  @Input() isEnabled = true;
  @Input() isRunning = false;
  @Input() isToggling = false;
  @Input() showSavingText = false;
  @Input() runDisabled = false;
  @Input() runBtnClass = 'btn btn-primary';
  @Input() runBtnBorderColor: string | null = null;
  @Input() runBtnTextColor: string | null = null;
  @Input() runLabel = '';
  @Input() runningLabel = '';
  @Output() toggleJob = new EventEmitter<void>();
  @Output() runJob = new EventEmitter<void>();
}
