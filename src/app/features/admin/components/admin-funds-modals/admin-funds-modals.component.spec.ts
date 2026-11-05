import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminFundsModalsComponent } from './admin-funds-modals.component';

describe('AdminFundsModalsComponent', () => {
  let component: AdminFundsModalsComponent;
  let fixture: ComponentFixture<AdminFundsModalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminFundsModalsComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(AdminFundsModalsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
