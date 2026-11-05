import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminScrapingPageComponent } from './admin-scraping-page.component';

describe('AdminScrapingPageComponent', () => {
  let component: AdminScrapingPageComponent;
  let fixture: ComponentFixture<AdminScrapingPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminScrapingPageComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(AdminScrapingPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
