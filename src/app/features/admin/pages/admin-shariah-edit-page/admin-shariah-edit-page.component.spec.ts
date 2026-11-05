import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminShariahEditPageComponent } from './admin-shariah-edit-page.component';

describe('AdminShariahEditPageComponent', () => {
  let component: AdminShariahEditPageComponent;
  let fixture: ComponentFixture<AdminShariahEditPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminShariahEditPageComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(AdminShariahEditPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
