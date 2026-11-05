import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MzNumberLineComponent } from './mz-number-line.component';

describe('MzNumberLineComponent', () => {
  let fixture: ComponentFixture<MzNumberLineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MzNumberLineComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(MzNumberLineComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
