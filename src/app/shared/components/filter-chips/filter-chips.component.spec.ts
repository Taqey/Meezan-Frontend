import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FilterChipsComponent } from './filter-chips.component';

describe('FilterChipsComponent', () => {
  let fixture: ComponentFixture<FilterChipsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterChipsComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(FilterChipsComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
