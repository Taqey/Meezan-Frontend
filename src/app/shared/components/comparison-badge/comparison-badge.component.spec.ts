import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComparisonBadgeComponent } from './comparison-badge.component';

describe('ComparisonBadgeComponent', () => {
  let fixture: ComponentFixture<ComparisonBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComparisonBadgeComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(ComparisonBadgeComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
