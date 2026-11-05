import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminReviewChecklistPageComponent } from './admin-review-checklist-page.component';

describe('AdminReviewChecklistPageComponent', () => {
  let component: AdminReviewChecklistPageComponent;
  let fixture: ComponentFixture<AdminReviewChecklistPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminReviewChecklistPageComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(AdminReviewChecklistPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
