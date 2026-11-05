import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MzPaginationButtonComponent } from './mz-pagination-button.component';

describe('MzPaginationButtonComponent', () => {
  let fixture: ComponentFixture<MzPaginationButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MzPaginationButtonComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(MzPaginationButtonComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
