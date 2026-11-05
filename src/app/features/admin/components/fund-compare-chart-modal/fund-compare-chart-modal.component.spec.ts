import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FundCompareChartModalComponent } from './fund-compare-chart-modal.component';

describe('FundCompareChartModalComponent', () => {
  let component: FundCompareChartModalComponent;
  let fixture: ComponentFixture<FundCompareChartModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundCompareChartModalComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(FundCompareChartModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
