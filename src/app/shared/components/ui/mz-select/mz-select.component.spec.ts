import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MzSelectComponent } from './mz-select.component';

describe('MzSelectComponent', () => {
  let fixture: ComponentFixture<MzSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MzSelectComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(MzSelectComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
