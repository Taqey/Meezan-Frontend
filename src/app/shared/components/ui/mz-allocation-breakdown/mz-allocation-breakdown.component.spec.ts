import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MzAllocationBreakdownComponent } from './mz-allocation-breakdown.component';

describe('MzAllocationBreakdownComponent', () => {
  let fixture: ComponentFixture<MzAllocationBreakdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MzAllocationBreakdownComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(MzAllocationBreakdownComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
