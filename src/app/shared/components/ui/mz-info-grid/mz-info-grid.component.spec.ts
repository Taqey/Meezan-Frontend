import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MzInfoGridComponent } from './mz-info-grid.component';

describe('MzInfoGridComponent', () => {
  let fixture: ComponentFixture<MzInfoGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MzInfoGridComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(MzInfoGridComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
