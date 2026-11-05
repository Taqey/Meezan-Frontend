import { Component, EventEmitter, HostListener, ElementRef, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ChevronDown } from 'lucide-angular';
import { type MzFilterOption } from '../models/mz-filter-option.model';

/** Dropdown with checkbox list (multi) or single choice. */
@Component({
  selector: 'mz-filter-dropdown',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  host: { class: 'mz', style: 'display:block' },
  templateUrl: './mz-filter-dropdown.component.html',
  styleUrl: './mz-filter-dropdown.component.css',
})
export class MzFilterDropdownComponent {
  readonly ChevronIcon = ChevronDown;
  @Input() label = '';
  @Input() ariaLabel = '';
  @Input() options: MzFilterOption[] = [];
  @Input() selected: string[] = [];
  @Input() multi = true;
  @Input() allLabel = '';
  @Output() selectedChange = new EventEmitter<string[]>();
  open = false;

  constructor(private el: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDoc(e: MouseEvent): void { if (!this.el.nativeElement.contains(e.target)) this.open = false; }

  get triggerLabel(): string {
    if (!this.selected.length) return this.allLabel || this.label;
    if (this.selected.length === 1) return this.options.find((o) => o.value === this.selected[0])?.label ?? this.selected[0];
    return `${this.label} (${this.selected.length})`;
  }
  isSelected(v: string): boolean { return this.selected.includes(v); }
  toggle(v: string): void {
    if (!this.multi) { this.selectedChange.emit(this.isSelected(v) ? [] : [v]); this.open = false; return; }
    this.selectedChange.emit(this.isSelected(v) ? this.selected.filter((x) => x !== v) : [...this.selected, v]);
  }
}
