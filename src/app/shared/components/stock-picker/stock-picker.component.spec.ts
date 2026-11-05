import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { StockPickerComponent } from './stock-picker.component';

describe('StockPickerComponent', () => {
  let component: StockPickerComponent;
  let fixture: ComponentFixture<StockPickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockPickerComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(StockPickerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
