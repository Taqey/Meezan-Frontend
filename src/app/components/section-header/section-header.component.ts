import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/** "N items…" lead line plus the optional last-session label. */
@Component({
  selector: 'app-section-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="section-head">
      <span>{{ lead }}</span>
      <span *ngIf="sessionDate" class="session-date">آخر جلسة تداول: <bdi dir="ltr">{{ sessionDate }}</bdi></span>
      <span *ngIf="sourceNote" class="source-note">{{ sourceNote }}</span>
    </div>
  `
})
export class SectionHeaderComponent {
  @Input() lead = '';
  @Input() sessionDate?: string | null;
  /** Small attribution line, e.g. "المصدر: مباشر · آخر تحديث: …". */
  @Input() sourceNote?: string | null;
}
