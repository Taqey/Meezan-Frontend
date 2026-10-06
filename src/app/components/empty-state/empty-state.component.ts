import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, type LucideIconData } from 'lucide-angular';

/** Friendly empty/error block with an optional link or retry action. */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div class="empty-state">
      <lucide-icon *ngIf="icon" [img]="icon" size="32"></lucide-icon>
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
      <a *ngIf="actionLink" [routerLink]="actionLink" routerLinkActive="active" class="btn btn-primary">
        {{ actionLabel }}
      </a>
      <button *ngIf="!actionLink && actionLabel" type="button" class="btn btn-primary" (click)="action.emit()">
        {{ actionLabel }}
      </button>
    </div>
  `
})
export class EmptyStateComponent {
  @Input() icon?: LucideIconData;
  @Input() title = '';
  @Input() message = '';
  @Input() actionLabel?: string | null;
  @Input() actionLink?: string | unknown[] | null;
  @Output() action = new EventEmitter<void>();
}
