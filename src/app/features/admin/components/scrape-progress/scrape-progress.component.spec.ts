import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ScrapeProgressComponent } from './scrape-progress.component';

describe('ScrapeProgressComponent', () => {
  let component: ScrapeProgressComponent;
  let fixture: ComponentFixture<ScrapeProgressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScrapeProgressComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(ScrapeProgressComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
