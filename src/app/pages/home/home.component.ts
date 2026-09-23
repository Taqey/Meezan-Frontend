import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  Sparkles,
  ArrowLeft,
  ChevronLeft,
  ShieldCheck,
  CircleHelp,
  LineChart
} from 'lucide-angular';
import { ApiService } from '../../services/api.service';
import { StockCardComponent } from '../../components/stock-card/stock-card.component';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import { IndexSummaryDto, StockListItemDto } from '../../models/api.models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, StockCardComponent, StatusBadgeComponent],
  template: `
    <section class="hero">
      <div class="hero-copy">
        <span class="eyebrow"><lucide-icon [img]="SparklesIcon" size="15"></lucide-icon> قراءة أوضح للسوق المصري</span>
        <h1>اتخذ قرارك الاستثماري <span>بميزان.</span></h1>
        <p>منصة عربية تساعدك على قراءة الأسهم والمؤشرات في البورصة المصرية، مع عرض شفاف للقيمة العادلة من 4 نماذج معتمدة وآراء الجهات الشرعية الثماني.</p>
        <div class="hero-actions">
          <a routerLink="/stocks" class="btn btn-primary">استكشف الأسهم <lucide-icon [img]="ArrowLeftIcon" size="16"></lucide-icon></a>
          <a routerLink="/indices" class="btn btn-outline">تصفح المؤشرات</a>
        </div>
        <div class="trust-row">
          <span><lucide-icon [img]="ShieldCheckIcon" size="14"></lucide-icon> لا توجد توصية استثمارية</span>
          <span><lucide-icon [img]="CircleHelpIcon" size="14"></lucide-icon> البيانات للتوضيح والتحليل فقط</span>
        </div>
      </div>

      <div class="hero-panel">
        <div class="panel-top">
          <span>لقطة السوق</span>
          <span class="market-state">
            <span class="live-dot"></span> متصل بقاعدة البيانات
          </span>
        </div>

        <div class="market-number">
          <strong>{{ totalStocksCount }}</strong>
          <span>سهم مُسجل ومُحدث</span>
        </div>

        <div class="panel-grid">
          <div>
            <small>المؤشرات الرسمية</small>
            <b>{{ indicesCount }} مؤشرات</b>
          </div>
          <div>
            <small>المصادر الشرعية</small>
            <b>7 جهات مستقلة</b>
          </div>
          <div>
            <small>نماذج التقييم</small>
            <b>4 معادلات (IQR)</b>
          </div>
        </div>
      </div>
    </section>

    <section class="stats-strip">
      <div class="stat">
        <strong>{{ totalStocksCount }}</strong>
        <span>سهم تتم متابعته</span>
      </div>
      <div class="stat">
        <strong>{{ indicesCount }}</strong>
        <span>مؤشرات رسمية للبورصة</span>
      </div>
      <div class="stat">
        <strong>7</strong>
        <span>مصادر شرعية مستقلة</span>
      </div>
      <div class="stat">
        <strong>4</strong>
        <span>طرق حساب القيمة العادلة</span>
      </div>
    </section>

    <!-- Market Leaders -->
    <section class="home-section">
      <div class="section-heading">
        <div>
          <span class="eyebrow">تحرك السوق</span>
          <h2>أبرز الأسهم تحركاً</h2>
          <p>أعلى الأسهم تغيراً في الجلسة حسب أحدث بيانات التداول المسجلة.</p>
        </div>
        <a routerLink="/stocks" class="text-link">عرض كل الأسهم <lucide-icon [img]="ChevronLeftIcon" size="15"></lucide-icon></a>
      </div>

      <div class="leader-grid" *ngIf="topStocks.length">
        <app-stock-card
          *ngFor="let s of topStocks"
          [ticker]="s.ticker"
          [nameAr]="s.nameAr"
          [nameEn]="s.nameEn"
          [closingPrice]="s.closingPrice"
          [changePct]="s.changePct"
          [fairValue]="s.fairValue"
          [priceComparison]="s.priceComparison"
          [shariahStatus]="s.shariahStatus"
          [indices]="s.indices"
          [currency]="s.currency"
          [sectorNameAr]="s.sectorNameAr">
        </app-stock-card>
      </div>

      <div *ngIf="!topStocks.length && !loading" class="empty-state">
        <p>لا توجد بيانات أسهم حالياً. يرجى مراجعة لوحة الإدارة لإجراء السحب أو الرفع.</p>
      </div>
    </section>

    <!-- Multi-source Shariah Preview Section -->
    <section class="home-section feature-section">
      <div class="feature-copy">
        <span class="eyebrow">شفافية كاملة</span>
        <h2>لا نختصر الرأي الشرعي في إجابة واحدة.</h2>
        <p>نعرض لك رأي كل جهة من الجهات السبع المستقلة كما هو، مع نسبة التطهير، وتاريخ التحديث ورابط القائمة، لتبني قراءتك على معلومات موثقة.</p>
        <a routerLink="/stocks" class="text-link">استعرض جميع الأسهم والآراء الشرعية <lucide-icon [img]="ArrowLeftIcon" size="15"></lucide-icon></a>
      </div>

      <div class="opinion-preview">
        <div class="opinion-head">
          <span>تغطية 7 مصادر شرعية معتمدة</span>
          <strong>7 / 7</strong>
        </div>
        <div class="opinion-row" *ngFor="let source of sampleSources">
          <span>{{ source.name }}</span>
          <app-status-badge [status]="source.status"></app-status-badge>
        </div>
      </div>
    </section>
  `
})
export class HomeComponent implements OnInit {
  readonly SparklesIcon = Sparkles;
  readonly ArrowLeftIcon = ArrowLeft;
  readonly ChevronLeftIcon = ChevronLeft;
  readonly ShieldCheckIcon = ShieldCheck;
  readonly CircleHelpIcon = CircleHelp;
  readonly LineChartIcon = LineChart;

  totalStocksCount = 0;
  indicesCount = 8;
  topStocks: StockListItemDto[] = [];
  loading = true;

  sampleSources = [
    { name: 'مصفّى (Musaffa)', status: 'Compliant' },
    { name: 'كاشف (Kashif)', status: 'Compliant' },
    { name: 'بورصة حلال (Halal Bourse)', status: 'Pending' },
    { name: 'ثندر (Thndr)', status: 'Compliant' },
    { name: 'بنك فيصل الإسلامي', status: 'Compliant' },
    { name: 'أسطول (Osoul)', status: 'Compliant' },
    { name: 'حلال إنفست (Halal Invest)', status: 'Compliant' }
  ];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.api.getStocks({ page: 1, pageSize: 6, sortBy: 'changePct', sortDir: 'desc' }).subscribe({
      next: (res) => {
        this.topStocks = res.items || [];
        this.totalStocksCount = res.totalCount || 0;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });

    this.api.getIndices().subscribe({
      next: (indices) => {
        if (indices?.length) {
          this.indicesCount = indices.length;
        }
      }
    });
  }
}
