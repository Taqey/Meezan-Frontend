import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MzStatusTagComponent } from './mz-status-tag.component';

describe('MzStatusTagComponent', () => {
  let fixture: ComponentFixture<MzStatusTagComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MzStatusTagComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(MzStatusTagComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
