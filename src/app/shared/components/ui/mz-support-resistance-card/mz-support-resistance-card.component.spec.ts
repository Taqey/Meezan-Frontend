import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MzSupportResistanceCardComponent } from './mz-support-resistance-card.component';

describe('MzSupportResistanceCardComponent', () => {
  let fixture: ComponentFixture<MzSupportResistanceCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MzSupportResistanceCardComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(MzSupportResistanceCardComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
