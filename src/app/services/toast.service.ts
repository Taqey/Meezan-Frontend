import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  text: string;
}

/** Minimal non-blocking toast channel (favorite add/remove confirmations). */
@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private nextId = 1;
  private readonly items = signal<ToastMessage[]>([]);

  readonly messages = this.items.asReadonly();

  /** Shows a short toast that dismisses itself after ~2.5s. */
  show(text: string): void {
    const id = this.nextId++;
    this.items.update((list) => [...list, { id, text }]);
    setTimeout(() => this.dismiss(id), 2500);
  }

  dismiss(id: number): void {
    this.items.update((list) => list.filter((m) => m.id !== id));
  }
}
