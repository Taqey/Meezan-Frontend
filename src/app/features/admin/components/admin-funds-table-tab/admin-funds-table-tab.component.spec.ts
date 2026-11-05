import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminFundsTableTabComponent } from './admin-funds-table-tab.component';

describe('AdminFundsTableTabComponent', () => {
  let component: AdminFundsTableTabComponent;
  let fixture: ComponentFixture<AdminFundsTableTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminFundsTableTabComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(AdminFundsTableTabComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
