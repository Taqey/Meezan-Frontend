import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, type LucideIconData } from 'lucide-angular';
import { MzSpinnerComponent } from '../mz-spinner/mz-spinner.component';

/** Button or router link rendered as a button. */
@Component({
  selector: 'mz-button',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, MzSpinnerComponent],
  host: { class: 'mz', style: 'display:inline-flex' },
  templateUrl: './mz-button.component.html',
  styleUrl: './mz-button.component.css',
})
export class MzButtonComponent {
  @Input() variant: 'default' | 'primary' | 'soft' = 'default';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() icon?: LucideIconData | null;
  @Input() link?: string | unknown[] | null;
  @Input() disabled = false;
  @Input() loading = false;
  @Input() block = false;
  @Input() pressed?: boolean | null;
  @Input() expanded?: boolean | null;
  @Output('clicked') pressed_ = new EventEmitter<Event>();
}
