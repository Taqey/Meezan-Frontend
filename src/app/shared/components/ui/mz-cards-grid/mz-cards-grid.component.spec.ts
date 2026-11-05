import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MzCardsGridComponent } from './mz-cards-grid.component';

describe('MzCardsGridComponent', () => {
  let fixture: ComponentFixture<MzCardsGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MzCardsGridComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(MzCardsGridComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
