import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminFundsChangeLogTabComponent } from './admin-funds-change-log-tab.component';

describe('AdminFundsChangeLogTabComponent', () => {
  let component: AdminFundsChangeLogTabComponent;
  let fixture: ComponentFixture<AdminFundsChangeLogTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminFundsChangeLogTabComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(AdminFundsChangeLogTabComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
