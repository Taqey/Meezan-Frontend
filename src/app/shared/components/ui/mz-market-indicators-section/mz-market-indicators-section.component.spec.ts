import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MzMarketIndicatorsSectionComponent } from './mz-market-indicators-section.component';

describe('MzMarketIndicatorsSectionComponent', () => {
  let fixture: ComponentFixture<MzMarketIndicatorsSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MzMarketIndicatorsSectionComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(MzMarketIndicatorsSectionComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
