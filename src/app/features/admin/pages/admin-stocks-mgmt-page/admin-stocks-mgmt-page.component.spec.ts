import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminStocksMgmtPageComponent } from './admin-stocks-mgmt-page.component';

describe('AdminStocksMgmtPageComponent', () => {
  let component: AdminStocksMgmtPageComponent;
  let fixture: ComponentFixture<AdminStocksMgmtPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminStocksMgmtPageComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(AdminStocksMgmtPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
