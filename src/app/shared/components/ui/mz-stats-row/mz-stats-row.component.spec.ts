import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MzStatsRowComponent } from './mz-stats-row.component';

describe('MzStatsRowComponent', () => {
  let fixture: ComponentFixture<MzStatsRowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MzStatsRowComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(MzStatsRowComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
