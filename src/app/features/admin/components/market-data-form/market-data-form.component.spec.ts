import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MarketDataFormComponent } from './market-data-form.component';

describe('MarketDataFormComponent', () => {
  let component: MarketDataFormComponent;
  let fixture: ComponentFixture<MarketDataFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarketDataFormComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(MarketDataFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
