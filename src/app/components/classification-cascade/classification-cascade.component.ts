import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { FundClassificationTreeNode } from '../../models/api.models';

export interface CascadeLevel {
  node: FundClassificationTreeNode | null;
  children: FundClassificationTreeNode[];
  label: string;
}

@Component({
  selector: 'app-classification-cascade',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cascade-wrap">
      <div *ngFor="let lvl of levels; let i = index; trackBy: trackLevel" class="cascade-level">
        <label class="filter-label" [attr.for]="'cascade-' + i">
          {{ i === 0 ? rootLabel : lvl.label }}
          <span *ngIf="lvl.node" class="cascade-count">({{ lvl.node.totalFundCount }})</span>
        </label>
        <select [id]="'cascade-' + i"
                [ngModel]="lvl.node?.slug ?? ''"
                (ngModelChange)="pick(i, $event)"
                [attr.aria-label]="i === 0 ? rootLabel : lvl.label">
          <option value="">{{ i === 0 ? allLabel : ('كل ' + lvl.label) }}</option>
          <option *ngFor="let c of lvl.children; trackBy: trackNode" [value]="c.slug">
            {{ c.nameAr }} ({{ c.totalFundCount }})
          </option>
        </select>
      </div>
    </div>
  `,
  styles: [`
    .cascade-wrap { display: contents; }
    .cascade-level { min-width: 0; }
    .cascade-level select { width: 100%; }
    .cascade-count { font-weight: 400; color: var(--muted-foreground); }
  `]
})
export class ClassificationCascadeComponent implements OnChanges {
  @Input() tree: FundClassificationTreeNode[] = [];
  @Input() path: string[] = [];
  @Input() rootLabel = 'نوع الصندوق';
  @Input() allLabel = 'كل الأنواع';
  @Output() pathChange = new EventEmitter<string[]>();

  levels: CascadeLevel[] = [];

  private bySlug = new Map<string, FundClassificationTreeNode>();
  private childrenMap = new Map<string | null, FundClassificationTreeNode[]>();

  ngOnChanges(changes: import('@angular/core').SimpleChanges): void {
    if (changes['tree']) this.indexTree();
    if (changes['tree'] || changes['path'] || changes['rootLabel']) this.buildLevels();
  }

  private indexTree(): void {
    this.bySlug = new Map();
    this.childrenMap = new Map();
    for (const n of this.tree) {
      this.bySlug.set(n.slug, n);
      const key = n.parentSlug ?? null;
      const arr = this.childrenMap.get(key);
      if (arr) arr.push(n); else this.childrenMap.set(key, [n]);
    }
    for (const arr of this.childrenMap.values()) {
      arr.sort((a, b) => a.displayOrder - b.displayOrder || a.nameAr.localeCompare(b.nameAr, 'ar'));
    }
  }

  private buildLevels(): void {
    const rootChildren = (this.childrenMap.get(null) ?? []).filter(c => c.totalFundCount > 0);
    const out: CascadeLevel[] = [
      { node: null, children: rootChildren, label: this.rootLabel }
    ];
    const seen = new Set<string>(); // حماية من التكرار
    for (const slug of this.path) {
      const node = this.bySlug.get(slug);
      if (!node || seen.has(slug)) break;
      seen.add(slug);
      out[out.length - 1].node = node;
      const kids = (this.childrenMap.get(node.slug) ?? []).filter(c => c.totalFundCount > 0);
      if (kids.length === 0) break;
      out.push({ node: null, children: kids, label: node.childrenLabelAr || 'التصنيف الفرعي' });
    }
    this.levels = out;
  }

  trackLevel = (i: number) => i;
  trackNode = (_: number, n: FundClassificationTreeNode) => n.slug;

  levelOptions(levelIndex: number): FundClassificationTreeNode[] {
    return this.levels[levelIndex]?.children ?? [];
  }

  pick(levelIndex: number, slug: string): void {
    const next = this.path.slice(0, levelIndex);
    if (slug) next.push(slug);
    this.pathChange.emit(next);
  }
}