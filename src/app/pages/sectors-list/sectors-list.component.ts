import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  Layers,
  ChevronLeft,
  Tag
} from 'lucide-angular';
import { ApiService } from '../../services/api.service';
import { SectorSummaryDto } from '../../models/api.models';

@Component({
  selector: 'app-sectors-list',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div class="page-intro">
      <div>
        <span class="eyebrow">تصنيف قطاعي · البورصة المصرية</span>
        <h1>القطاعات الاقتصادية</h1>
        <p>تصفّح الأسهم المتوافقة شرعاً مرتبةً حسب قطاعها الاقتصادي. اختر قطاعاً لعرض أسهمه وتقييماتهم الشرعية والعادلة.</p>
      </div>
      <div class="intro-note">
        <lucide-icon [img]="LayersIcon" size="17"></lucide-icon>
        <span>{{ sectors.length }} قطاع يضم أسهماً في قاعدة البيانات</span>
      </div>
    </div>

    <div *ngIf="loading" class="empty-state">
      <p>جارٍ تحميل القطاعات الاقتصادية...</p>
    </div>

    <div class="index-grid" *ngIf="!loading && sectors.length">
      <a
        *ngFor="let sector of sectors"
        [routerLink]="['/indices/Sectoral-Indices', sector.id]"
        class="index-card sector-card"
      >
        <div class="index-card-top">
          <span class="index-icon sector-icon">
            <lucide-icon [img]="TagIcon" size="20"></lucide-icon>
          </span>
          <span class="sector-stock-count">{{ sector.stocksCount }} سهم</span>
        </div>

        <h2>{{ sector.nameAr }}</h2>
        <p>{{ sector.nameEn }}</p>

        <div class="index-card-bottom">
          <span>{{ sector.stocksCount }} سهم مُصنَّف في هذا القطاع</span>
          <lucide-icon [img]="ChevronLeftIcon" size="15"></lucide-icon>
        </div>
      </a>
    </div>

    <div *ngIf="!loading && !sectors.length" class="empty-state">
      <lucide-icon [img]="LayersIcon" size="32"></lucide-icon>
      <h3>لا توجد قطاعات مسجّلة حتى الآن</h3>
      <p>يتم استخراج القطاعات تلقائياً عند رفع كشوف المؤشرات من البورصة المصرية.</p>
    </div>
  `
})
export class SectorsListComponent implements OnInit {
  readonly LayersIcon = Layers;
  readonly ChevronLeftIcon = ChevronLeft;
  readonly TagIcon = Tag;

  sectors: SectorSummaryDto[] = [];
  loading = true;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getSectors().subscribe({
      next: (data) => {
        this.sectors = data || [];
        this.loading = false;
      },
      error: () => {
        this.sectors = [];
        this.loading = false;
      }
    });
  }
}
