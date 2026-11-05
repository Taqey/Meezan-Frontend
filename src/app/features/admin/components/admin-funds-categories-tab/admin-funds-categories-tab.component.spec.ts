import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminFundsCategoriesTabComponent } from './admin-funds-categories-tab.component';

describe('AdminFundsCategoriesTabComponent', () => {
  let component: AdminFundsCategoriesTabComponent;
  let fixture: ComponentFixture<AdminFundsCategoriesTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminFundsCategoriesTabComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(AdminFundsCategoriesTabComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
