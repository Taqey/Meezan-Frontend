import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/** "N items…" lead line plus the optional last-session label. */
@Component({
  selector: 'app-section-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './section-header.component.html',
})
export class SectionHeaderComponent {
  @Input() lead = '';
  @Input() sessionDate?: string | null;
  /** Small attribution line, e.g. "المصدر: مباشر · آخر تحديث: …". */
  @Input() sourceNote?: string | null;
}
