import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortfolioAllocationItem } from '../../services/portfolio-simplifier.service';

interface SvgSlice {
  path: string;
  color: string;
}

@Component({
  selector: 'app-portfolio-donut-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg class="donut-chart" viewBox="0 0 100 100" role="img" [attr.aria-label]="ariaLabel">
      <path *ngFor="let slice of slices" [attr.d]="slice.path" [attr.fill]="slice.color" />
      <circle cx="50" cy="50" r="25" fill="#ffffff" />
    </svg>
  `,
  styles: [`
    :host {
      display: block;
      width: 140px;
      height: 140px;
      margin: auto;
    }
    .donut-chart {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
    }
  `]
})
export class PortfolioDonutChartComponent {
  @Input() items: PortfolioAllocationItem[] = [];

  get ariaLabel(): string {
    return this.items.map(i => `${i.label}: ${i.rounded}%`).join(', ');
  }

  get slices(): SvgSlice[] {
    let cumulativePercent = 0;
    const slices: SvgSlice[] = [];

    this.items.forEach(item => {
      const startAngle = (cumulativePercent / 100) * 360;
      cumulativePercent += item.rounded;
      const endAngle = (cumulativePercent / 100) * 360;

      const x1 = 50 + 40 * Math.cos((Math.PI * startAngle) / 180);
      const y1 = 50 + 40 * Math.sin((Math.PI * startAngle) / 180);
      const x2 = 50 + 40 * Math.cos((Math.PI * endAngle) / 180);
      const y2 = 50 + 40 * Math.sin((Math.PI * endAngle) / 180);

      const largeArcFlag = item.rounded > 50 ? 1 : 0;
      const pathData = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

      slices.push({
        path: pathData,
        color: item.color
      });
    });

    return slices;
  }
}
