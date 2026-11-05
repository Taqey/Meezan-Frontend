import { Component, EventEmitter, HostListener, ElementRef, Input, Output, forwardRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { LucideAngularModule, ChevronDown, Check } from 'lucide-angular';
import { type MzOption } from '../models/mz-option.model';

let nextSelectId = 1;

@Component({
  selector: 'mz-select',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  host: { class: 'mz mz-select-host', style: 'display:block' },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MzSelectComponent),
      multi: true
    }
  ],
  templateUrl: './mz-select.component.html',
  styleUrl: './mz-select.component.css',
})
export class MzSelectComponent implements ControlValueAccessor, OnDestroy {
  readonly ChevronIcon = ChevronDown;
  readonly CheckIcon = Check;
  readonly listboxId = `mz-select-listbox-${nextSelectId++}`;

  @Input() options: MzOption[] = [];
  @Input() value: any = null;
  @Input() ariaLabel = '';
  @Input() placeholder = '';
  @Input() disabled = false;
  @Input() size: 'default' | 'compact' = 'default';
  @Output() valueChange = new EventEmitter<any>();

  @ViewChild('panelRef') panelRef?: ElementRef<HTMLElement>;

  open = false;
  flipUp = false;
  activeIndex = -1;

  private onChangeCallback: (v: any) => void = () => {};
  private onTouchedCallback: () => void = () => {};
  private scrollListener?: () => void;
  private resizeListener?: () => void;
  private panelEl?: HTMLElement;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngOnDestroy(): void {
    this.close();
  }

  get hasSelection(): boolean {
    return this.options.some((o) => this.isEqual(o.value, this.value));
  }

  get selectedLabel(): string {
    const found = this.options.find((o) => this.isEqual(o.value, this.value));
    if (found) return found.label;
    if (this.placeholder) return this.placeholder;
    return this.options[0]?.label ?? '';
  }

  isEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null && b === '') return true;
    if (a === '' && b == null) return true;
    return false;
  }

  writeValue(val: any): void {
    this.value = val;
  }

  registerOnChange(fn: any): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouchedCallback = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  toggleOpen(): void {
    if (this.disabled || !this.options.length) return;
    if (this.open) {
      this.close();
    } else {
      this.openDropdown();
    }
  }

  openDropdown(): void {
    if (this.disabled || !this.options.length) return;
    const idx = this.options.findIndex((o) => this.isEqual(o.value, this.value));
    this.activeIndex = idx >= 0 ? idx : 0;
    this.open = true;

    // Reposition panel and attach to body portal
    setTimeout(() => {
      this.attachAndPositionPanel();
    }, 0);
  }

  private attachAndPositionPanel(): void {
    if (!this.open || !this.panelRef) return;
    const panel = this.panelRef.nativeElement;
    this.panelEl = panel;

    if (panel.parentElement !== document.body) {
      document.body.appendChild(panel);
    }

    this.updatePosition();

    // Attach listeners to reposition / close on scroll & resize
    if (!this.scrollListener) {
      this.scrollListener = () => {
        if (!this.open) return;
        this.updatePosition();
      };
      window.addEventListener('scroll', this.scrollListener, true);
    }
    if (!this.resizeListener) {
      this.resizeListener = () => {
        if (!this.open) return;
        this.updatePosition();
      };
      window.addEventListener('resize', this.resizeListener);
    }
  }

  private updatePosition(): void {
    if (!this.open || !this.panelEl) return;
    const trigger = this.el.nativeElement.querySelector('.mz-select-trigger') as HTMLElement;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    // If trigger is detached or out of viewport (e.g. page scrolled away)
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      this.close();
      return;
    }

    this.flipUp = false;
    this.panelEl.classList.remove('flip-up');
    this.panelEl.style.bottom = 'auto';
    this.panelEl.style.top = `${Math.round(rect.bottom + 6)}px`;
    const spaceBelow = window.innerHeight - rect.bottom;
    this.panelEl.style.maxHeight = `${Math.min(280, Math.max(100, Math.floor(spaceBelow - 16)))}px`;

    const minWidth = Math.max(140, Math.round(rect.width));
    this.panelEl.style.minWidth = `${minWidth}px`;

    // Right-aligned in RTL: align panel right edge to trigger right edge
    let left = Math.round(rect.right - minWidth);
    if (left < 10) left = 10;
    if (left + minWidth > window.innerWidth - 10) {
      left = Math.max(10, window.innerWidth - minWidth - 10);
    }
    this.panelEl.style.left = `${left}px`;
    this.panelEl.style.right = 'auto';
  }

  close(): void {
    if (!this.open) return;
    this.open = false;

    // Clean up body portal
    if (this.panelEl && this.panelEl.parentElement === document.body) {
      document.body.removeChild(this.panelEl);
    }
    this.panelEl = undefined;

    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener, true);
      this.scrollListener = undefined;
    }
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
      this.resizeListener = undefined;
    }

    this.onTouchedCallback();
  }

  selectIndex(i: number, event?: Event): void {
    if (event) event.stopPropagation();
    const opt = this.options[i];
    if (!opt || opt.disabled) return;
    this.value = opt.value;
    this.onChangeCallback(opt.value);
    this.valueChange.emit(opt.value);
    this.close();
  }

  onTriggerKeydown(e: KeyboardEvent): void {
    if (this.disabled) return;
    if (!this.open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.openDropdown();
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      this.close();
    } else if (e.key === 'Tab') {
      this.close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.moveActive(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.moveActive(-1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      this.activeIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      this.activeIndex = Math.max(0, this.options.length - 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (this.activeIndex >= 0 && this.activeIndex < this.options.length) {
        this.selectIndex(this.activeIndex);
      }
    }
  }

  private moveActive(delta: number): void {
    const len = this.options.length;
    if (!len) return;
    let next = this.activeIndex + delta;
    if (next < 0) next = len - 1;
    if (next >= len) next = 0;
    this.activeIndex = next;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    if (!this.open) return;
    const target = e.target as Node;
    const insideTrigger = this.el.nativeElement.contains(target);
    const insidePanel = this.panelEl ? this.panelEl.contains(target) : false;
    if (!insideTrigger && !insidePanel) {
      this.close();
    }
  }
}
