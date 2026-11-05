import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminShariahSeedPageComponent } from './admin-shariah-seed-page.component';

describe('AdminShariahSeedPageComponent', () => {
  let component: AdminShariahSeedPageComponent;
  let fixture: ComponentFixture<AdminShariahSeedPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminShariahSeedPageComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(AdminShariahSeedPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
