import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MzSpinnerComponent } from './mz-spinner.component';

describe('MzSpinnerComponent', () => {
  let fixture: ComponentFixture<MzSpinnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MzSpinnerComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(MzSpinnerComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
