import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MzDetailsHeaderCardComponent } from './mz-details-header-card.component';

describe('MzDetailsHeaderCardComponent', () => {
  let fixture: ComponentFixture<MzDetailsHeaderCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MzDetailsHeaderCardComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(MzDetailsHeaderCardComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
