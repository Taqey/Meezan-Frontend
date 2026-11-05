import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { StocksListComponent } from './stocks-list.component';

describe('StocksListComponent', () => {
  let fixture: ComponentFixture<StocksListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StocksListComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(StocksListComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
