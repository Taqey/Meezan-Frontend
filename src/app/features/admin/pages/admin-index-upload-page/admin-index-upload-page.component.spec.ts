import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminIndexUploadPageComponent } from './admin-index-upload-page.component';

describe('AdminIndexUploadPageComponent', () => {
  let component: AdminIndexUploadPageComponent;
  let fixture: ComponentFixture<AdminIndexUploadPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminIndexUploadPageComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(AdminIndexUploadPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
