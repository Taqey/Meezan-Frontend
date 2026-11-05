import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { CreateStockFormComponent } from './create-stock-form.component';

describe('CreateStockFormComponent', () => {
  let component: CreateStockFormComponent;
  let fixture: ComponentFixture<CreateStockFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateStockFormComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(CreateStockFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
