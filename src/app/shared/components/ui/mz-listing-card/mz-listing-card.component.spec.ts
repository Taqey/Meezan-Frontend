import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MzListingCardComponent } from './mz-listing-card.component';

describe('MzListingCardComponent', () => {
  let fixture: ComponentFixture<MzListingCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MzListingCardComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(MzListingCardComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
