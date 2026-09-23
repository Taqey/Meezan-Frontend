import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  BarChart3,
  Layers3,
  ChevronLeft
} from 'lucide-angular';
import { ApiService } from '../../services/api.service';
import { IndexSummaryDto } from '../../models/api.models';

@Component({
  selector: 'app-indices-list',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div class="page-intro">
      <div>
        <span class="eyebrow">صورة أكبر للسوق</span>
        <h1>المؤشرات الرسمية للبورصة المصرية</h1>
        <p>تعرّف على مكونات كل مؤشر معتمد، وتابع أوزان الأسهم داخله وتقييماتها الشرعية والعادلة.</p>
      </div>
      <div class="intro-note">
        <lucide-icon [img]="Layers3Icon" size="17"></lucide-icon>
        <span>تُحدَّث بيانات المؤشرات دورياً من كشوف البورصة الرسمية</span>
      </div>
    </div>

    <div *ngIf="loading" class="empty-state">
      <p>جارٍ تحميل قائمة المؤشرات...</p>
    </div>

    <div class="index-grid" *ngIf="!loading">
      <a *ngFor="let index of indices" [routerLink]="['/indices', index.code]" class="index-card">
        <div class="index-card-top">
          <span class="index-icon">
            <lucide-icon [img]="BarChart3Icon" size="20"></lucide-icon>
          </span>
          <span class="index-code">{{ index.code }}</span>
        </div>

        <h2>{{ index.nameAr }}</h2>
        <p>{{ index.description || index.nameEn }}</p>

        <div class="index-card-bottom">
          <span>{{ index.constituentsCount }} سهم مكوّن</span>
          <span>آخر تحديث: {{ (index.lastUpdated | date:'yyyy-MM-dd') || 'غير محدد' }}</span>
          <lucide-icon [img]="ChevronLeftIcon" size="15"></lucide-icon>
        </div>
      </a>
    </div>
  `
})
export class IndicesListComponent implements OnInit {
  readonly BarChart3Icon = BarChart3;
  readonly Layers3Icon = Layers3;
  readonly ChevronLeftIcon = ChevronLeft;

  indices: IndexSummaryDto[] = [];
  loading = true;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getIndices().subscribe({
      next: (data) => {
        this.indices = data || [];
        this.loading = false;
      },
      error: () => {
        this.indices = [];
        this.loading = false;
      }
    });
  }
}
