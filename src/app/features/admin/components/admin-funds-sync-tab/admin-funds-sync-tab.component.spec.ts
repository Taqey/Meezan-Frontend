import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminFundsSyncTabComponent } from './admin-funds-sync-tab.component';

describe('AdminFundsSyncTabComponent', () => {
  let component: AdminFundsSyncTabComponent;
  let fixture: ComponentFixture<AdminFundsSyncTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminFundsSyncTabComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(AdminFundsSyncTabComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
