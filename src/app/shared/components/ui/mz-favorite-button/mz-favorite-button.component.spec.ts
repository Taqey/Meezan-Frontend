import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MzFavoriteButtonComponent } from './mz-favorite-button.component';

describe('MzFavoriteButtonComponent', () => {
  let fixture: ComponentFixture<MzFavoriteButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MzFavoriteButtonComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(MzFavoriteButtonComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
