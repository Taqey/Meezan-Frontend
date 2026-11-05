import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { KpiStripComponent } from './kpi-strip.component';

describe('KpiStripComponent', () => {
  let fixture: ComponentFixture<KpiStripComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpiStripComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(KpiStripComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
