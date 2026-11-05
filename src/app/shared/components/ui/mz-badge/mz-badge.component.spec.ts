import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MzBadgeComponent } from './mz-badge.component';

describe('MzBadgeComponent', () => {
  let fixture: ComponentFixture<MzBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MzBadgeComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(MzBadgeComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
