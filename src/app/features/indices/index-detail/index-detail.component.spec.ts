import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { IndexDetailComponent } from './index-detail.component';

describe('IndexDetailComponent', () => {
  let fixture: ComponentFixture<IndexDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IndexDetailComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(IndexDetailComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
