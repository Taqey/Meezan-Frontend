import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminClassificationModalsComponent } from './admin-classification-modals.component';

describe('AdminClassificationModalsComponent', () => {
  let component: AdminClassificationModalsComponent;
  let fixture: ComponentFixture<AdminClassificationModalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminClassificationModalsComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(AdminClassificationModalsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
