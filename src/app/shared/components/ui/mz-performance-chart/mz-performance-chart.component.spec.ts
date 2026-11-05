import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MzPerformanceChartComponent } from './mz-performance-chart.component';

describe('MzPerformanceChartComponent', () => {
  let fixture: ComponentFixture<MzPerformanceChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MzPerformanceChartComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(MzPerformanceChartComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
