import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PurificationComponent } from './purification.component';

describe('PurificationComponent', () => {
  let fixture: ComponentFixture<PurificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PurificationComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(PurificationComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
