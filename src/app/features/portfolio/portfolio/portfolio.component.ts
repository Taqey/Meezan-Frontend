import { Component, ElementRef, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  PieChart,
  Layers,
  ArrowLeftRight,
  Download,
  Copy,
  RotateCcw,
  Plus,
  Trash2,
  UploadCloud,
  Info
} from 'lucide-angular';
import { MzPageHeaderComponent } from '../../../shared/components/ui/mz-page-header/mz-page-header.component';
import { MzBadgeComponent } from '../../../shared/components/ui/mz-badge/mz-badge.component';

declare global {
  interface Window {
    initPortfolioEngine?: () => void;
    _portfolioEngineInitialized?: boolean;
    XLSX?: any;
    ExcelJS?: any;
  }
}

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    MzPageHeaderComponent,
    MzBadgeComponent
  ],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.css']
})
export class PortfolioComponent implements OnInit, OnDestroy {
  readonly PieChartIcon = PieChart;
  readonly LayersIcon = Layers;
  readonly ArrowLeftRightIcon = ArrowLeftRight;
  readonly DownloadIcon = Download;
  readonly CopyIcon = Copy;
  readonly RotateCcwIcon = RotateCcw;
  readonly PlusIcon = Plus;
  readonly Trash2Icon = Trash2;
  readonly UploadCloudIcon = UploadCloud;
  readonly InfoIcon = Info;

  private scriptsLoaded = false;

  constructor(private host: ElementRef) {}

  ngOnInit(): void {
    this.loadRequiredScripts();
  }

  ngOnDestroy(): void {
    // cleanup if needed
  }

  private loadRequiredScripts(): void {
    this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js')
      .then(() => this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js'))
      .then(() => this.loadScript('/portfolio-engine.js'))
      .then(() => {
        this.scriptsLoaded = true;
        if (typeof window.initPortfolioEngine === 'function') {
          window.initPortfolioEngine();
        }
      })
      .catch((err) => {
        console.error('Failed to load portfolio calculation scripts:', err);
      });
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.onload = () => resolve();
      script.onerror = (e) => reject(e);
      document.body.appendChild(script);
    });
  }
}
