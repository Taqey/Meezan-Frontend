import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MzButtonComponent } from './mz-button.component';

describe('MzButtonComponent', () => {
  let fixture: ComponentFixture<MzButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MzButtonComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(MzButtonComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
