import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MzBackLinkComponent } from './mz-back-link.component';

describe('MzBackLinkComponent', () => {
  let fixture: ComponentFixture<MzBackLinkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MzBackLinkComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(MzBackLinkComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
