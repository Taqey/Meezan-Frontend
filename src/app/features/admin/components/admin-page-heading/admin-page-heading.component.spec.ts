import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminPageHeadingComponent } from './admin-page-heading.component';

describe('AdminPageHeadingComponent', () => {
  let component: AdminPageHeadingComponent;
  let fixture: ComponentFixture<AdminPageHeadingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPageHeadingComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(AdminPageHeadingComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
