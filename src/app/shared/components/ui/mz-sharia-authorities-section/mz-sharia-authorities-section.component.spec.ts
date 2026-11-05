import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MzShariaAuthoritiesSectionComponent } from './mz-sharia-authorities-section.component';

describe('MzShariaAuthoritiesSectionComponent', () => {
  let fixture: ComponentFixture<MzShariaAuthoritiesSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MzShariaAuthoritiesSectionComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(MzShariaAuthoritiesSectionComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
