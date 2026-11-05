import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MzChipComponent } from './mz-chip.component';

describe('MzChipComponent', () => {
  let fixture: ComponentFixture<MzChipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MzChipComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(MzChipComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
