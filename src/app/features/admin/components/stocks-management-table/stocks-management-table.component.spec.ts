import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { StocksManagementTableComponent } from './stocks-management-table.component';

describe('StocksManagementTableComponent', () => {
  let component: StocksManagementTableComponent;
  let fixture: ComponentFixture<StocksManagementTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StocksManagementTableComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(StocksManagementTableComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
