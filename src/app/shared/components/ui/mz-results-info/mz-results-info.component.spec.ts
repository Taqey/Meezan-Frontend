import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MzResultsInfoComponent } from './mz-results-info.component';

describe('MzResultsInfoComponent', () => {
  let fixture: ComponentFixture<MzResultsInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MzResultsInfoComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(MzResultsInfoComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
