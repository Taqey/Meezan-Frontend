import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FundDetailComponent } from './fund-detail.component';

describe('FundDetailComponent', () => {
  let fixture: ComponentFixture<FundDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundDetailComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(FundDetailComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
