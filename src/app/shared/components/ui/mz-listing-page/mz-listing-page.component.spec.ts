import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MzListingPageComponent } from './mz-listing-page.component';

describe('MzListingPageComponent', () => {
  let fixture: ComponentFixture<MzListingPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MzListingPageComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(MzListingPageComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
