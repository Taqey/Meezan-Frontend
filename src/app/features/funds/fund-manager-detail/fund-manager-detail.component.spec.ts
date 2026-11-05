import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FundManagerDetailComponent } from './fund-manager-detail.component';

describe('FundManagerDetailComponent', () => {
  let fixture: ComponentFixture<FundManagerDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundManagerDetailComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(FundManagerDetailComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
