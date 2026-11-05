import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, PieChart, Info, Copy, RotateCcw, ChevronDown, ChevronUp, ExternalLink } from 'lucide-angular';
import { PortfolioSimplifierService, CalculationResult, MethodResult } from '../services/portfolio-simplifier.service';
import { InvestorProfile } from './portfolio-config.data';
import { PORTFOLIO_SOURCES, PortfolioSource } from './portfolio-sources.data';
import { PortfolioDonutChartComponent } from './portfolio-donut-chart.component';
import { ToastService } from '../../../core/services/toast.service';
import { MzPageHeaderComponent } from '../../../shared/components/ui/mz-page-header/mz-page-header.component';
import { MzDetailsSectionComponent } from '../../../shared/components/ui/mz-details-section/mz-details-section.component';
import { MzBadgeComponent } from '../../../shared/components/ui/mz-badge/mz-badge.component';
import { MzButtonComponent } from '../../../shared/components/ui/mz-button/mz-button.component';
import { MzBackLinkComponent } from '../../../shared/components/ui/mz-back-link/mz-back-link.component';

@Component({
  selector: 'app-portfolio-simplifier',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    PortfolioDonutChartComponent,
    MzPageHeaderComponent,
    MzDetailsSectionComponent,
    MzBadgeComponent,
    MzButtonComponent,
    MzBackLinkComponent
  ],
  templateUrl: './portfolio-simplifier.component.html',
  styleUrl: './portfolio-simplifier.component.css',
})
export class PortfolioSimplifierComponent {
  readonly PieChartIcon = PieChart;
  readonly InfoIcon = Info;
  readonly CopyIcon = Copy;
  readonly RotateCcwIcon = RotateCcw;
  readonly ChevronDownIcon = ChevronDown;
  readonly ChevronUpIcon = ChevronUp;
  readonly ExternalLinkIcon = ExternalLink;

  age: number | null = null;
  selectedProfile: InvestorProfile | null = null;
  includeGold = false;
  totalAmount: number | null = null;

  ageError = false;
  profileError = false;

  result: CalculationResult | null = null;
  expandedMethods: Record<number, boolean> = {};

  sourcesExpanded = false;
  expandedSourceItems: Record<string, boolean> = {};
  highlightedSource: string | null = null;

  @ViewChild('resultsSection') resultsSection?: ElementRef;
  @ViewChild('sourcesSection') sourcesSection?: ElementRef;

  readonly sourcesEntries = Object.entries(PORTFOLIO_SOURCES).map(([key, source]) => ({
    key,
    source
  }));

  constructor(
    private simplifierService: PortfolioSimplifierService,
    private toast: ToastService
  ) {}

  calculate(): void {
    if (this.age === null || isNaN(this.age) || this.age < 18 || this.age > 80) {
      this.ageError = true;
      return;
    }
    this.ageError = false;

    if (!this.selectedProfile) {
      this.profileError = true;
      return;
    }
    this.profileError = false;

    this.result = this.simplifierService.calculate(
      this.age,
      this.selectedProfile,
      this.includeGold,
      this.totalAmount || 0
    );

    setTimeout(() => {
      this.resultsSection?.nativeElement.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }

  reset(): void {
    this.age = null;
    this.selectedProfile = null;
    this.includeGold = false;
    this.totalAmount = null;
    this.ageError = false;
    this.profileError = false;
    this.result = null;
    this.expandedMethods = {};
  }

  toggleDetails(index: number): void {
    this.expandedMethods[index] = !this.expandedMethods[index];
  }

  toggleSourceItem(key: string): void {
    this.expandedSourceItems[key] = !this.expandedSourceItems[key];
  }

  scrollToSource(key: string): void {
    this.sourcesExpanded = true;
    this.expandedSourceItems[key] = true;
    this.highlightedSource = key;

    setTimeout(() => {
      const el = document.getElementById(`source_block_${key}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    setTimeout(() => {
      if (this.highlightedSource === key) {
        this.highlightedSource = null;
      }
    }, 2500);
  }

  getRelatedSourceKeys(method: MethodResult): string[] {
    return Array.from(new Set([
      ...(method.sourceTopicKeys || []),
      'core_satellite_ratios',
      'defensive_vs_growth',
      'gold_pct',
      'egx_adaptation'
    ]));
  }

  getSourceShortTitle(key: string): string {
    const src = PORTFOLIO_SOURCES[key];
    if (!src) return key;
    return src.title.split('(')[0].trim();
  }

  formatCurrency(num: number): string {
    return Math.round(num).toLocaleString('ar-EG');
  }

  copyResults(): void {
    if (!this.result) return;
    let text = "نتائج خطة محفظتي الاستثمارية في البورصة المصرية (EGX):\n\n";
    this.result.methods.forEach(method => {
      text += `📌 ${method.name}\n`;
      method.items.forEach(it => {
        const amountStr = it.amount ? ` (${this.formatCurrency(it.amount)} ج.م)` : '';
        text += ` - ${it.rounded}% ${it.label}${amountStr}\n`;
      });
      text += "\n";
    });

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.toast.show('تم نسخ نتائج المحفظة بنجاح!');
      });
    }
  }
}
