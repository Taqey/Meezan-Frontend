import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SourcePdfStatusCardComponent } from './source-pdf-status-card.component';

describe('SourcePdfStatusCardComponent', () => {
  let component: SourcePdfStatusCardComponent;
  let fixture: ComponentFixture<SourcePdfStatusCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SourcePdfStatusCardComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(SourcePdfStatusCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
