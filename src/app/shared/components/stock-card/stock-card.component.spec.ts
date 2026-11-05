import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { StockCardComponent } from './stock-card.component';

describe('StockCardComponent', () => {
  let fixture: ComponentFixture<StockCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockCardComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(StockCardComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
