import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  ArrowLeft,
  BarChart3,
  Search,
  Filter,
  FileSpreadsheet
} from 'lucide-angular';
import { ApiService } from '../../services/api.service';
import { StockCardComponent } from '../../components/stock-card/stock-card.component';
import { ConstituentItemDto, IndexConstituentsPagedResultDto } from '../../models/api.models';

@Component({
  selector: 'app-index-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, LucideAngularModule, StockCardComponent],
  template: `
    <div *ngIf="loading" class="empty-state">
      <p>جارٍ تحميل بيانات مكونات المؤشر...</p>
    </div>

    <div *ngIf="!loading && !result" class="empty-state">
      <h3>المؤشر غير موجود</h3>
      <a routerLink="/indices" class="text-link">العودة إلى المؤشرات</a>
    </div>

    <div *ngIf="!loading && result">
      <div class="page-intro index-detail-intro">
        <div>
          <a routerLink="/indices" class="back-link">
            <lucide-icon [img]="ArrowLeftIcon" size="15"></lucide-icon> العودة إلى المؤشرات
          </a>
          <span class="eyebrow">مؤشر البورصة الرسمية</span>
          <h1>{{ result.indexNameAr || result.indexCode }}</h1>
          <p>{{ result.indexNameEn }} · كود المؤشر: {{ result.indexCode }}</p>
        </div>

        <div class="index-stat">
          <strong>{{ result.totalCount }}</strong>
          <span>سهم مكوّن</span>
          <small *ngIf="result.lastUpdated">تحديث: {{ result.lastUpdated | date:'yyyy-MM-dd' }}</small>
        </div>
      </div>

      <!-- Filters for index constituents -->
      <div class="filters" style="grid-template-columns: 2fr 1fr 1fr;">
        <div class="search-wrap">
          <lucide-icon [img]="SearchIcon" size="17"></lucide-icon>
          <input
            [(ngModel)]="search"
            (ngModelChange)="onFilterChange()"
            placeholder="ابحث في أسهم المؤشر..." />
        </div>

        <select [(ngModel)]="shariahStatus" (change)="onFilterChange()">
          <option value="">كل الأحكام الشرعية</option>
          <option value="Compliant">متوافق شرعاً</option>
          <option value="NonCompliant">غير متوافق</option>
          <option value="Pending">قيد المراجعة</option>
          <option value="Blocked">محظور</option>
        </select>

        <select [(ngModel)]="priceComparison" (change)="onFilterChange()">
          <option value="">كل التقييمات العادلة</option>
          <option value="Cheap">أرخص من العادلة</option>
          <option value="Fair">قريبة من العادلة</option>
          <option value="Expensive">أغلى من العادلة</option>
          <option value="Unavailable">لا يمكن حساب القيمة العادلة</option>
        </select>
      </div>

      <div class="results-head">
        <span>الأسهم المكوّنة للمؤشر (مرتبة بالأوزان وتفاصيل الآراء الشرعية)</span>
        <span>الصفحة {{ page }} من {{ result.totalPages || 1 }}</span>
      </div>

      <!-- Constituents Grid -->
      <div class="stock-grid" *ngIf="result.items && result.items.length">
        <app-stock-card
          *ngFor="let item of result.items"
          [ticker]="item.ticker"
          [nameAr]="item.nameAr"
          [nameEn]="item.nameEn"
          [closingPrice]="item.closingPrice"
          [changePct]="item.changePct"
          [fairValue]="item.fairValue"
          [priceComparison]="item.priceComparison"
          [shariahStatus]="item.shariahStatus"
          [indices]="item.indices"
          [weight]="item.weight"
          [currency]="item.currency"
          [sectorNameAr]="item.sectorNameAr">
        </app-stock-card>
      </div>

      <!-- Empty State -->
      <div *ngIf="!result.items?.length" class="empty-state">
        <p>لا توجد أسهم مطابقة لخيارات البحث داخل هذا المؤشر.</p>
      </div>

      <!-- Pagination -->
      <div class="pagination-wrap" *ngIf="result.totalPages > 1">
        <button [disabled]="page <= 1" (click)="setPage(page - 1)">السابق</button>
        <button class="active">{{ page }}</button>
        <button [disabled]="page >= result.totalPages" (click)="setPage(page + 1)">التالي</button>
      </div>
    </div>
  `
})
export class IndexDetailComponent implements OnInit {
  readonly ArrowLeftIcon = ArrowLeft;
  readonly SearchIcon = Search;

  code = '';
  result?: IndexConstituentsPagedResultDto | null;
  loading = true;

  page = 1;
  pageSize = 24;
  search = '';
  shariahStatus = '';
  priceComparison = '';

  constructor(
    private route: ActivatedRoute,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.code = params.get('code') || '';
      if (this.code) {
        this.loadConstituents();
      }
    });
  }

  loadConstituents(): void {
    this.loading = true;
    this.api.getIndexConstituents(this.code, {
      page: this.page,
      pageSize: this.pageSize,
      search: this.search || undefined,
      shariahStatus: this.shariahStatus || undefined,
      priceComparison: this.priceComparison || undefined
    }).subscribe({
      next: (data) => {
        this.result = data;
        this.loading = false;
      },
      error: () => {
        this.result = null;
        this.loading = false;
      }
    });
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadConstituents();
  }

  setPage(p: number): void {
    this.page = p;
    this.loadConstituents();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
