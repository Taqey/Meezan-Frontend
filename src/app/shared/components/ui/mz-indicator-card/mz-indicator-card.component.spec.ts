import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MzIndicatorCardComponent } from './mz-indicator-card.component';

describe('MzIndicatorCardComponent', () => {
  let fixture: ComponentFixture<MzIndicatorCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MzIndicatorCardComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(MzIndicatorCardComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
