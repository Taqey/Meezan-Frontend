import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MzFiltersBarComponent } from './mz-filters-bar.component';

describe('MzFiltersBarComponent', () => {
  let fixture: ComponentFixture<MzFiltersBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MzFiltersBarComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(MzFiltersBarComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
