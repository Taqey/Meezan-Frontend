import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ShieldCheck } from 'lucide-angular';
import { RevealDirective } from '../../../shared/directives/reveal.directive';
import { MzPageHeaderComponent } from '../../../shared/components/ui/mz-page-header/mz-page-header.component';
import { MzDetailsSectionComponent } from '../../../shared/components/ui/mz-details-section/mz-details-section.component';
import { MzBadgeComponent } from '../../../shared/components/ui/mz-badge/mz-badge.component';
import {
  CRITERION_LABELS,
  CRITERION_ORDER,
  SHARIAH_STANDARDS,
  scholarsDebtMax,
  type ShariahCriterionKey
} from '../../../shared/models/shariah-standards';

@Component({
  selector: 'app-shariah-standards',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    RevealDirective,
    MzPageHeaderComponent,
    MzDetailsSectionComponent,
    MzBadgeComponent
  ],
  templateUrl: './shariah-standards.component.html',
  styleUrl: './shariah-standards.component.css',
})
export class ShariahStandardsComponent {
  readonly ShieldCheckIcon = ShieldCheck;

  readonly standards = SHARIAH_STANDARDS;
  readonly criterionOrder: readonly ShariahCriterionKey[] = CRITERION_ORDER;
  readonly criterionLabels = CRITERION_LABELS;
  readonly scholarsMax = scholarsDebtMax;
}
