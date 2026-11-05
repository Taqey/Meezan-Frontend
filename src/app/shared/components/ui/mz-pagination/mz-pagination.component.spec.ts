import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MzPaginationComponent } from './mz-pagination.component';

describe('MzPaginationComponent', () => {
  let fixture: ComponentFixture<MzPaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MzPaginationComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(MzPaginationComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
