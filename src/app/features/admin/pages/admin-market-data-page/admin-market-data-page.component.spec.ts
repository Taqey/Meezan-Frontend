import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminMarketDataPageComponent } from './admin-market-data-page.component';

describe('AdminMarketDataPageComponent', () => {
  let component: AdminMarketDataPageComponent;
  let fixture: ComponentFixture<AdminMarketDataPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminMarketDataPageComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(AdminMarketDataPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
