import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PdfUploadFormComponent } from './pdf-upload-form.component';

describe('PdfUploadFormComponent', () => {
  let component: PdfUploadFormComponent;
  let fixture: ComponentFixture<PdfUploadFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfUploadFormComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(PdfUploadFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
