import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, type LucideIconData } from 'lucide-angular';
import { MzSpinnerComponent } from '../ui/mz-spinner/mz-spinner.component';

/** Friendly empty/error block with an optional link or retry action. */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, MzSpinnerComponent],
  templateUrl: './empty-state.component.html',
})
export class EmptyStateComponent {
  @Input() icon?: LucideIconData;
  @Input() title = '';
  @Input() message = '';
  @Input() actionLabel?: string | null;
  @Input() actionLink?: string | unknown[] | null;
  @Input() loading = false;
  @Output() action = new EventEmitter<void>();
}
