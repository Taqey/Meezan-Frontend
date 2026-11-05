import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MzIconComponent } from './mz-icon.component';

describe('MzIconComponent', () => {
  let fixture: ComponentFixture<MzIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MzIconComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(MzIconComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
