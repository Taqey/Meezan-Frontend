import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { StockHeaderBannerComponent } from './stock-header-banner.component';

describe('StockHeaderBannerComponent', () => {
  let component: StockHeaderBannerComponent;
  let fixture: ComponentFixture<StockHeaderBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockHeaderBannerComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(StockHeaderBannerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
