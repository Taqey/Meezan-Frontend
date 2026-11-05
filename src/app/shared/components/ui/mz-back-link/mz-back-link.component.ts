import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, ArrowRight } from 'lucide-angular';

/* ───────────── BackLink ───────────── */
@Component({
  selector: 'mz-back-link',
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  host: { class: 'mz', style: 'display:block' },
  templateUrl: './mz-back-link.component.html',
  styleUrl: './mz-back-link.component.css',
})
export class MzBackLinkComponent {
  readonly ArrowIcon = ArrowRight;
  @Input() label = '';
  @Input() to: string | unknown[] = '/';
}
