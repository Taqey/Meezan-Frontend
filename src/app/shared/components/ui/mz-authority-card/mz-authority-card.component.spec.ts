import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MzAuthorityCardComponent } from './mz-authority-card.component';

describe('MzAuthorityCardComponent', () => {
  let fixture: ComponentFixture<MzAuthorityCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MzAuthorityCardComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(MzAuthorityCardComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
