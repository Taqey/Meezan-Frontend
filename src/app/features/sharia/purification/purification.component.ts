import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RevealDirective } from '../../../shared/directives/reveal.directive';
import {
  LucideAngularModule,
  ShieldCheck,
  BookOpen,
  Calendar,
  Info,
  ChevronDown,
  TrendingUp
} from 'lucide-angular';
import { MzPageHeaderComponent } from '../../../shared/components/ui/mz-page-header/mz-page-header.component';
import { MzDetailsSectionComponent } from '../../../shared/components/ui/mz-details-section/mz-details-section.component';
import { MzBadgeComponent } from '../../../shared/components/ui/mz-badge/mz-badge.component';
import { MzButtonComponent } from '../../../shared/components/ui/mz-button/mz-button.component';
import {
  FAISAL_SUB_ROW,
  PURIFICATION_APPROACHES,
  calculatePurification,
  type CalculatorApproach,
  type PurificationApproachId
} from '../../../shared/models/purification';

@Component({
  selector: 'app-purification',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    RevealDirective,
    MzPageHeaderComponent,
    MzDetailsSectionComponent,
    MzBadgeComponent,
    MzButtonComponent
  ],
  templateUrl: './purification.component.html',
  styleUrl: './purification.component.css',
})
export class PurificationComponent {
  readonly ShieldCheckIcon = ShieldCheck;
  readonly BookOpenIcon = BookOpen;
  readonly CalendarIcon = Calendar;
  readonly InfoIcon = Info;
  readonly ChevronDownIcon = ChevronDown;
  readonly TrendingUpIcon = TrendingUp;

  readonly approaches = PURIFICATION_APPROACHES;
  readonly faisal = FAISAL_SUB_ROW;
  readonly letters = ['أ', 'ب', 'ج'];

  openApproach: PurificationApproachId | null = 'ownership';

  dividends: number | null = null;
  capitalGain: number | null = null;
  ratioPct: number | null = null;
  calcApproach: CalculatorApproach = 'received-profits';

  get calculatorOptions() {
    return this.approaches.filter((a) => a.id !== 'ownership');
  }

  get calcTouched(): boolean {
    return this.dividends != null || this.capitalGain != null || this.ratioPct != null;
  }

  get calcResult(): number | null {
    if (!this.calcTouched) return null;
    return calculatePurification(this.dividends, this.capitalGain, this.ratioPct, this.calcApproach);
  }

  get calcBreakdown(): string {
    const ratio = this.ratioPct ?? 0;
    if (this.calcApproach === 'received-profits') {
      return `${ratio}% × (${this.dividends ?? 0} + ${this.capitalGain ?? 0})`;
    }
    return `${ratio}% × ${this.dividends ?? 0}`;
  }

  toggleApproach(id: PurificationApproachId): void {
    this.openApproach = this.openApproach === id ? null : id;
  }

  resetCalculator(): void {
    this.dividends = null;
    this.capitalGain = null;
    this.ratioPct = null;
    this.calcApproach = 'received-profits';
  }
}
