import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-host',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-host" aria-live="polite" aria-atomic="false">
      <div class="toast-item" *ngFor="let m of toast.messages()">
        <span>{{ m.text }}</span>
        <button type="button" class="toast-close" (click)="toast.dismiss(m.id)" aria-label="إغلاق التنبيه">×</button>
      </div>
    </div>
  `
})
export class ToastHostComponent {
  constructor(readonly toast: ToastService) {}
}
