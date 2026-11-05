import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, type LucideIconData } from 'lucide-angular';

/* ───────────────────────── Level 1 ───────────────────────── */
/** Generic icon wrapper (lucide). */
@Component({
  selector: 'mz-icon',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './mz-icon.component.html',
  styleUrl: './mz-icon.component.css',
})
export class MzIconComponent {
  @Input() icon?: LucideIconData | null;
  @Input() size = 16;
}
