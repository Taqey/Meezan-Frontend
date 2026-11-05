import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MzFairValueCardComponent } from './mz-fair-value-card.component';

describe('MzFairValueCardComponent', () => {
  let fixture: ComponentFixture<MzFairValueCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MzFairValueCardComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(MzFairValueCardComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
