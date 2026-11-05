import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MzSearchInputComponent } from './mz-search-input.component';

describe('MzSearchInputComponent', () => {
  let fixture: ComponentFixture<MzSearchInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MzSearchInputComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(MzSearchInputComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
