import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MzStatCardComponent } from './mz-stat-card.component';

describe('MzStatCardComponent', () => {
  let fixture: ComponentFixture<MzStatCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MzStatCardComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(MzStatCardComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
