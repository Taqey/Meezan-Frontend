import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MzInfoCardComponent } from './mz-info-card.component';

describe('MzInfoCardComponent', () => {
  let fixture: ComponentFixture<MzInfoCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MzInfoCardComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(MzInfoCardComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
