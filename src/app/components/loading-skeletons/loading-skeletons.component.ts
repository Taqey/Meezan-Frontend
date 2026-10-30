import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Shimmer placeholders for grids, KPI strips, and details pages while data loads.
 * Uses `display: contents` on host so when placed inside `.mz-stats` or `.mz-grid`,
 * its items are direct CSS grid children and occupy the exact same columns/gaps/heights.
 */
@Component({
  selector: 'app-loading-skeletons',
  standalone: true,
  imports: [CommonModule],
  host: { style: 'display: contents' },
  template: `
    <section class="mz-grid cols-3" *ngIf="variant === 'card'" aria-hidden="true">
      <div class="mz-card mz-lcard mz-sk-card"
           [ngClass]="'kind-' + cardType"
           [style.min-height.px]="cardType === 'fund' ? 319 : (cardType === 'entity' ? 205.4 : (cardType === 'index' ? 231 : 249))"
           *ngFor="let n of range; trackBy: trackIdx">
        <!-- STOCK CARD SKELETON -->
        <ng-container *ngIf="cardType === 'stock'">
          <div class="mz-lcard-top">
            <div class="mz-lcard-head">
              <div class="mz-lcard-id">
                <div class="mz-lcard-text">
                  <span class="mz-lcard-sub" style="padding:0;border:none;background:transparent;"><span class="sk-line" style="display:block;width:44px;height:20px;border-radius:6px;"></span></span>
                  <h3 class="mz-lcard-title"><span class="sk-line" style="display:block;width:100%;height:18px;"></span></h3>
                  <span class="sk-line" style="width:24px;height:24px;border-radius:4px;flex-shrink:0;"></span>
                </div>
              </div>
              <div class="mz-lcard-badges">
                <span class="mz-badge neutral" style="min-width:52px;height:22px;"><span class="sk-line" style="width:36px;height:10px;"></span></span>
              </div>
            </div>
            <div class="mz-lcard-main">
              <span class="mz-lcard-main-value"><span class="sk-line" style="display:inline-block;width:88px;height:24px;vertical-align:middle;"></span></span>
              <span class="mz-lcard-main-unit"><span class="sk-line" style="display:inline-block;width:24px;height:12px;"></span></span>
            </div>
          </div>
          <div class="mz-lcard-bottom">
            <div class="mz-lcard-ribbon-wrap">
              <div class="mz-lcard-ribbon" style="background:transparent;padding:0;">
                <span class="sk-line" style="width:100%;height:28px;border-radius:8px;display:block;"></span>
              </div>
            </div>
            <div class="mz-lcard-tags">
              <div class="mz-lcard-tag-row">
                <span class="sk-line" style="width:96px;height:20px;border-radius:999px;"></span>
              </div>
            </div>
            <div class="mz-lcard-foot">
              <div class="mz-lcard-foot-start">
                <span class="sk-line" style="width:110px;height:20px;border-radius:6px;"></span>
              </div>
              <div class="mz-lcard-foot-end">
                <span class="sk-line" style="width:56px;height:14px;border-radius:4px;"></span>
              </div>
            </div>
          </div>
        </ng-container>

        <!-- FUND CARD SKELETON -->
        <ng-container *ngIf="cardType === 'fund'">
          <div class="mz-lcard-top">
            <div class="mz-lcard-head">
              <div class="mz-lcard-id">
                <div class="sk-line" style="width:48px;height:48px;flex-shrink:0;border-radius:10px;"></div>
                <div class="mz-lcard-text">
                  <h3 class="mz-lcard-title"><span class="sk-line" style="display:block;width:82%;height:18px;margin-top:2px;"></span></h3>
                </div>
              </div>
              <div class="mz-lcard-badges" style="flex-direction:column;align-items:flex-end;">
                <span class="sk-line" style="width:68px;height:22px;border-radius:6px;"></span>
                <span class="sk-line" style="width:80px;height:22px;border-radius:6px;"></span>
              </div>
            </div>
            <div class="mz-lcard-metrics">
              <div class="mz-metric" *ngFor="let m of [0,1,2,3,4,5]">
                <span class="mz-metric-label"><span class="sk-line" style="display:block;width:54px;height:14px;"></span></span>
                <span class="mz-metric-value"><span class="sk-line" style="display:block;width:64px;height:22px;"></span></span>
              </div>
            </div>
          </div>
          <div class="mz-lcard-bottom">
            <div class="mz-lcard-foot">
              <div class="mz-lcard-foot-start"></div>
              <div class="mz-lcard-foot-end">
                <span class="sk-line" style="width:94px;height:16px;border-radius:4px;"></span>
              </div>
            </div>
          </div>
        </ng-container>

        <!-- ENTITY CARD SKELETON (SECTORS / INDICES) -->
        <ng-container *ngIf="cardType === 'entity' || cardType === 'index'">
          <div class="mz-lcard-top">
            <div class="mz-lcard-head">
              <div class="mz-lcard-id">
                <span class="sk-line" style="width:48px;height:48px;border-radius:8px;flex-shrink:0;"></span>
                <div class="mz-lcard-text">
                  <h3 class="mz-lcard-title"><span class="sk-line" style="display:block;width:78%;height:18px;margin-top:2px;"></span></h3>
                  <span class="mz-lcard-sub"><span class="sk-line" style="display:block;width:60%;height:12px;margin-top:2px;"></span></span>
                </div>
              </div>
              <div class="mz-lcard-badges">
                <span class="sk-line" style="width:64px;height:22px;border-radius:6px;"></span>
              </div>
            </div>
            <div class="mz-lcard-metrics">
              <div class="mz-metric" *ngFor="let m of [0,1]">
                <span class="mz-metric-label"><span class="sk-line" style="display:block;width:62px;height:14px;"></span></span>
                <span class="mz-metric-value"><span class="sk-line" style="display:block;width:76px;height:24px;"></span></span>
                <span *ngIf="cardType === 'index' && m === 1" class="sk-line" style="display:block;width:85%;height:20px;margin-top:2px;"></span>
              </div>
            </div>
          </div>
          <div class="mz-lcard-bottom">
            <div class="mz-lcard-foot">
              <div class="mz-lcard-foot-start"></div>
              <div class="mz-lcard-foot-end">
                <span class="sk-line" style="width:104px;height:16px;border-radius:4px;"></span>
              </div>
            </div>
          </div>
        </ng-container>
      </div>
    </section>

    <div class="kpi-grid" *ngIf="variant === 'kpi'" aria-hidden="true">
      <div class="kpi-card" *ngFor="let n of range; trackBy: trackIdx">
        <div class="sk-line sk-text"></div>
        <div class="sk-line sk-price"></div>
      </div>
    </div>

    <ng-container *ngIf="variant === 'stat'">
      <div class="mz-card mz-stat" *ngFor="let n of range; trackBy: trackIdx" style="height:100%" aria-hidden="true">
        <div class="mz-stat-top">
          <span class="mz-stat-label"><span class="sk-line" style="display:inline-block;width:88px;height:14px;vertical-align:middle;"></span></span>
          <span class="mz-stat-icon"><span class="sk-line" style="width:18px;height:18px;border-radius:4px;"></span></span>
        </div>
        <div class="mz-stat-body">
          <span class="mz-stat-value"><span class="sk-line" style="display:inline-block;width:76px;height:24px;vertical-align:middle;"></span></span>
          <span class="mz-stat-chip" style="background:transparent;padding:0;"><span class="sk-line" style="display:inline-block;width:48px;height:20px;border-radius:999px;vertical-align:middle;"></span></span>
        </div>
      </div>
    </ng-container>

    <!-- DETAILS PAGE SKELETON -->
    <div class="mz" *ngIf="variant === 'details'" aria-hidden="true">
      <div class="sk-line" style="width:120px;height:20px;margin-bottom:16px;border-radius:6px;"></div>
      <div class="mz-card mz-dheader">
        <div class="mz-dheader-main" style="flex:1">
          <div class="mz-dheader-code">
            <span class="sk-line" style="width:60px;height:18px;"></span>
            <span class="sk-line" style="width:140px;height:14px;"></span>
          </div>
          <div class="mz-dheader-titlerow" style="margin-top:8px;">
            <span class="sk-line" style="width:260px;max-width:80%;height:38px;border-radius:8px;"></span>
          </div>
          <div class="mz-dheader-tags">
            <span class="sk-line" style="width:92px;height:24px;border-radius:999px;"></span>
            <span class="sk-line" style="width:76px;height:24px;border-radius:999px;"></span>
          </div>
        </div>
        <div class="mz-dheader-price">
          <span class="sk-line" style="width:90px;height:14px;"></span>
          <span class="sk-line" style="width:130px;height:44px;margin:4px 0;border-radius:8px;"></span>
          <span class="sk-line" style="width:64px;height:22px;border-radius:6px;"></span>
        </div>
      </div>

      <div class="mz-details-two" style="margin:20px 0;">
        <div class="mz-card mz-dsection" *ngFor="let s of [0,1]">
          <div class="mz-dsection-head">
            <div>
              <span class="sk-line" style="display:block;width:70px;height:12px;margin-bottom:6px;"></span>
              <span class="sk-line" style="display:block;width:180px;height:24px;"></span>
            </div>
          </div>
          <span class="sk-line" style="display:block;width:100%;height:140px;border-radius:10px;"></span>
        </div>
      </div>

      <div class="mz-card mz-dsection" style="margin-bottom:20px;">
        <div class="mz-dsection-head">
          <div>
            <span class="sk-line" style="display:block;width:80px;height:12px;margin-bottom:6px;"></span>
            <span class="sk-line" style="display:block;width:210px;height:24px;"></span>
          </div>
        </div>
        <div class="mz-infogrid">
          <div class="mz-indicator" *ngFor="let i of [0,1,2,3,4,5,6,7]">
            <span class="sk-line" style="width:65%;height:12px;margin:0 auto 6px;"></span>
            <span class="sk-line" style="width:50%;height:20px;margin:0 auto;"></span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoadingSkeletonsComponent {
  @Input() count = 6;
  @Input() variant: 'card' | 'kpi' | 'stat' | 'details' = 'card';
  @Input() cardType: 'stock' | 'fund' | 'entity' | 'index' = 'stock';

  get range(): number[] {
    return Array.from({ length: Math.max(0, this.count) }, (_, i) => i);
  }

  trackIdx(index: number): number {
    return index;
  }
}
