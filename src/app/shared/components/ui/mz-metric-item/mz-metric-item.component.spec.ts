import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MzMetricItemComponent } from './mz-metric-item.component';

describe('MzMetricItemComponent', () => {
  let fixture: ComponentFixture<MzMetricItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MzMetricItemComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(MzMetricItemComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
