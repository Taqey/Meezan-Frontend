import { Component, EventEmitter, HostListener, ElementRef, Input, Output, forwardRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Search, ChevronDown, Check, Star, FileText, ExternalLink, type LucideIconData } from 'lucide-angular';
import { FavoriteToggleComponent } from '../favorite-toggle/favorite-toggle.component';
import { MzSpinnerComponent } from './mz-spinner.component';

export type Tone = 'positive' | 'negative' | 'muted' | null | undefined;

/* ───────────────────────── Level 1 ───────────────────────── */

/** Generic icon wrapper (lucide). */
@Component({
  selector: 'mz-icon',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `<lucide-icon *ngIf="icon" [img]="icon" [size]="size"></lucide-icon>`
})
export class MzIconComponent {
  @Input() icon?: LucideIconData | null;
  @Input() size = 16;
}

/** Button or router link rendered as a button. */
@Component({
  selector: 'mz-button',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, MzSpinnerComponent],
  host: { class: 'mz', style: 'display:inline-flex' },
  template: `
    <a *ngIf="link; else btn" class="mz-btn" [ngClass]="variant" [routerLink]="link">
      <lucide-icon *ngIf="icon" [img]="icon" [size]="15"></lucide-icon><ng-content></ng-content>
    </a>
    <ng-template #btn>
      <button class="mz-btn" [ngClass]="[variant, block ? 'block' : '']" [attr.type]="type" [disabled]="disabled || loading"
              [attr.aria-busy]="loading || null"
              [attr.aria-pressed]="pressed ?? null" [attr.aria-expanded]="expanded ?? null" (click)="pressed_.emit($event)">
        <mz-spinner *ngIf="loading" [active]="true" [immediate]="true" size="small"></mz-spinner>
        <lucide-icon *ngIf="icon && !loading" [img]="icon" [size]="15"></lucide-icon><ng-content></ng-content>
      </button>
    </ng-template>
  `
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

@Component({
  selector: 'mz-badge',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'mz', style: 'display:inline-flex' },
  template: `<span class="mz-badge" [ngClass]="[tone, pill ? 'pill' : '']"><ng-content></ng-content></span>`
})
export class MzBadgeComponent {
  @Input() tone: 'default' | 'neutral' | 'danger' | 'warn' | 'outline' = 'default';
  @Input() pill = false;
}

@Component({
  selector: 'mz-chip',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'mz', style: 'display:inline-flex' },
  template: `<button type="button" class="mz-chip" [class.active]="active" [attr.aria-pressed]="active" (click)="selected.emit()"><ng-content></ng-content></button>`
})
export class MzChipComponent {
  @Input() active = false;
  @Output() selected = new EventEmitter<void>();
}

@Component({
  selector: 'mz-search-input',
  standalone: true,
  imports: [LucideAngularModule],
  host: { class: 'mz', style: 'display:block;width:100%' },
  template: `
    <div class="mz-input-wrap">
      <span class="mz-input-icon"><lucide-icon [img]="SearchIcon" [size]="18"></lucide-icon></span>
      <input class="mz-input" type="text" [value]="value" [placeholder]="placeholder" [attr.aria-label]="ariaLabel || placeholder"
             (input)="valueChange.emit($any($event.target).value)" />
    </div>
  `
})
export class MzSearchInputComponent {
  readonly SearchIcon = Search;
  @Input() value = '';
  @Input() placeholder = '';
  @Input() ariaLabel = '';
  @Output() valueChange = new EventEmitter<string>();
}

export interface MzOption { value: any; label: string; disabled?: boolean; }

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
  template: `
    <div class="mz-select-wrap" [class.is-open]="open" [class.is-disabled]="disabled" [class.flip-up]="flipUp" [class.compact]="size === 'compact'">
      <button
        type="button"
        class="mz-select-trigger"
        [class.compact]="size === 'compact'"
        role="combobox"
        [attr.aria-expanded]="open"
        aria-haspopup="listbox"
        [attr.aria-controls]="listboxId"
        [attr.aria-label]="ariaLabel || placeholder || selectedLabel"
        [disabled]="disabled"
        (click)="toggleOpen()"
        (keydown)="onTriggerKeydown($event)">
        <span class="mz-select-label" [class.is-placeholder]="!hasSelection && !!placeholder">{{ selectedLabel }}</span>
        <span class="mz-select-chevron" [class.rotated]="open">
          <lucide-icon [img]="ChevronIcon" [size]="15"></lucide-icon>
        </span>
      </button>

      <div
        #panelRef
        *ngIf="open"
        class="mz mz-select-panel"
        role="listbox"
        [id]="listboxId"
        [attr.aria-label]="ariaLabel || placeholder">
        <button
          *ngFor="let o of options; let i = index"
          type="button"
          role="option"
          class="mz-select-option"
          [class.is-selected]="isEqual(o.value, value)"
          [class.is-active]="i === activeIndex"
          [disabled]="!!o.disabled"
          [attr.aria-selected]="isEqual(o.value, value)"
          (mouseenter)="activeIndex = i"
          (click)="selectIndex(i, $event)">
          <span class="mz-select-option-text">{{ o.label }}</span>
          <span class="mz-select-option-check" *ngIf="isEqual(o.value, value)">
            <lucide-icon [img]="CheckIcon" [size]="15"></lucide-icon>
          </span>
        </button>
      </div>
    </div>
  `
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

/** Star toggle bound to the shared favorites service. */
@Component({
  selector: 'mz-favorite-button',
  standalone: true,
  imports: [FavoriteToggleComponent],
  host: { class: 'mz mz-fav' },
  template: `<app-favorite-toggle [symbol]="symbol"></app-favorite-toggle>`
})
export class MzFavoriteButtonComponent {
  @Input() symbol = '';
}

/** Compliant / non-compliant / neutral tag. */
@Component({
  selector: 'mz-status-tag',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'mz', style: 'display:inline-flex' },
  template: `<span class="mz-tag" [ngClass]="tone"><span class="mz-tag-dot"></span>{{ label }}</span>`
})
export class MzStatusTagComponent {
  @Input() tone: 'good' | 'bad' | 'neutral' = 'neutral';
  @Input() label = '';
}

/* ───────────────────────── Level 2 ───────────────────────── */

export interface MzStat {
  label: string;
  value: string | number | null;
  icon?: LucideIconData;
  chip?: string | null;
  accent?: boolean;
  /** Smaller text value (e.g. top performer name). */
  text?: string | null;
}

@Component({
  selector: 'mz-stat-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  host: { class: 'mz', style: 'display:block' },
  template: `
    <div class="mz-card mz-stat" style="height:100%">
      <div class="mz-stat-top">
        <span class="mz-stat-label">{{ stat.label }}</span>
        <span class="mz-stat-icon" *ngIf="stat.icon"><lucide-icon [img]="stat.icon" [size]="18"></lucide-icon></span>
      </div>
      <div class="mz-stat-body">
        <span class="mz-stat-value" [class.accent]="stat.accent">{{ stat.value ?? '—' }}</span>
        <span class="mz-stat-chip" *ngIf="stat.chip">{{ stat.chip }}</span>
      </div>
    </div>
  `
})
export class MzStatCardComponent {
  @Input() stat!: MzStat;
}

export interface MzMetric { label: string; value: string | number | null | undefined; tone?: Tone; ltr?: boolean; }

@Component({
  selector: 'mz-metric-item',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'mz', style: 'display:block;min-width:0' },
  template: `
    <div class="mz-metric">
      <span class="mz-metric-label">{{ label }}</span>
      <span class="mz-metric-value" [ngClass]="value == null || value === '' ? 'muted' : tone" [class.mz-ltr]="ltr">{{ value == null || value === '' ? '—' : value }}</span>
    </div>
  `
})
export class MzMetricItemComponent {
  @Input() label = '';
  @Input() value: string | number | null | undefined;
  @Input() tone: Tone;
  @Input() ltr = false;
}

export interface MzFilterOption { value: string; label: string; }

/** Dropdown with checkbox list (multi) or single choice. */
@Component({
  selector: 'mz-filter-dropdown',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  host: { class: 'mz', style: 'display:block' },
  template: `
    <div class="mz-fdrop">
      <button type="button" class="mz-fdrop-trigger" (click)="open = !open" [attr.aria-expanded]="open" [attr.aria-label]="ariaLabel || label">
        <span>{{ triggerLabel }}</span><lucide-icon [img]="ChevronIcon" [size]="14"></lucide-icon>
      </button>
      <div class="mz-fdrop-panel" *ngIf="open">
        <label class="mz-fdrop-item" *ngFor="let o of options">
          <input [type]="multi ? 'checkbox' : 'radio'" [checked]="isSelected(o.value)" (change)="toggle(o.value)" />
          <span>{{ o.label }}</span>
        </label>
      </div>
    </div>
  `
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

@Component({
  selector: 'mz-pagination-button',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'mz', style: 'display:inline-flex' },
  template: `<button type="button" class="mz-pgbtn" [class.active]="active" [disabled]="disabled" (click)="pressed.emit()"><ng-content></ng-content></button>`
})
export class MzPaginationButtonComponent {
  @Input() active = false;
  @Input() disabled = false;
  @Output() pressed = new EventEmitter<void>();
}

@Component({
  selector: 'mz-indicator-card',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  host: { class: 'mz', style: 'display:block' },
  template: `
    <div class="mz-indicator">
      <span class="mz-indicator-label">{{ label }}</span>
      <ng-container *ngIf="link && value != null && value !== '' && value !== '—'; else plainValue">
        <span class="mz-indicator-value" [class.mz-ltr]="ltr">
          <a class="mz-manager-link" [routerLink]="link" [attr.aria-label]="ariaLabel || ('عرض جميع صناديق ' + value)">
            <span>{{ value }}</span>
            <span class="mz-manager-arrow" aria-hidden="true">←</span>
          </a>
          <a *ngIf="externalUrl" [href]="externalUrl" target="_blank" rel="noopener noreferrer"
             class="mz-manager-ext" [attr.aria-label]="'الموقع الخارجي لـ ' + value"
             (click)="$event.stopPropagation()">
            <lucide-icon [img]="ExternalLinkIcon" [size]="13"></lucide-icon>
          </a>
        </span>
      </ng-container>
      <ng-template #plainValue>
        <span class="mz-indicator-value" [class.mz-ltr]="ltr">{{ value == null || value === '' ? '—' : value }}</span>
      </ng-template>
      <span class="mz-indicator-hint" *ngIf="hint">{{ hint }}</span>
    </div>
  `
})
export class MzIndicatorCardComponent {
  readonly ExternalLinkIcon = ExternalLink;
  @Input() label = '';
  @Input() value: string | number | null | undefined;
  @Input() hint?: string | null;
  @Input() ltr = false;
  @Input() link?: string | unknown[] | null;
  @Input() ariaLabel?: string | null;
  @Input() externalUrl?: string | null;
}

export interface MzAuthority {
  name: string;
  status: 'good' | 'bad' | 'neutral';
  statusLabel: string;
  date?: string | null;
  note?: string | null;
  pdfUrl?: string | null;
  actionLabel?: string | null;
}

@Component({
  selector: 'mz-authority-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MzStatusTagComponent],
  host: { class: 'mz mz-authority-host' },
  template: `
    <div class="mz-authority" [ngClass]="authority.status">
      <div class="mz-authority-top">
        <div class="mz-authority-head">
          <span class="mz-authority-name">{{ authority.name }}</span>
          <mz-status-tag *ngIf="authority.name !== 'مؤشر الشريعة EGX33'" [tone]="authority.status" [label]="authority.statusLabel"></mz-status-tag>
        </div>
        <div class="mz-authority-verdict" [class.no-opinion]="authority.statusLabel === 'لا يوجد رأي مسجّل'">
          {{ authority.statusLabel }}
        </div>
        <div class="mz-authority-meta">
          <span *ngIf="authority.date">{{ authority.date }}</span>
          <span *ngIf="!authority.date && authority.name === 'مؤشر الشريعة EGX33'" class="mz-authority-egx33-code">EGX33</span>
        </div>
      </div>
      <div class="mz-authority-bottom">
        <div class="mz-authority-note" *ngIf="authority.note">{{ authority.note }}</div>
        <div class="mz-authority-actions" *ngIf="authority.pdfUrl || authority.actionLabel">
          <a *ngIf="authority.pdfUrl" [href]="authority.pdfUrl" target="_blank" rel="noopener noreferrer" class="mz-authority-pdf">
            <lucide-icon [img]="FileTextIcon" [size]="14"></lucide-icon> View PDF
          </a>
          <button *ngIf="authority.actionLabel" type="button" class="mz-authority-action" (click)="action.emit()">
            {{ authority.actionLabel }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class MzAuthorityCardComponent {
  readonly FileTextIcon = FileText;
  @Input() authority!: MzAuthority;
  @Output() action = new EventEmitter<void>();
}

export const MZ_STAR = Star;
