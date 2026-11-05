import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminClassificationComponent } from './admin-classification.component';

describe('AdminClassificationComponent', () => {
  let fixture: ComponentFixture<AdminClassificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminClassificationComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(AdminClassificationComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
