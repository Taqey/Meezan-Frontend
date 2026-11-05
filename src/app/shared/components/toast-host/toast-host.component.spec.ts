import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ToastHostComponent } from './toast-host.component';

describe('ToastHostComponent', () => {
  let fixture: ComponentFixture<ToastHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastHostComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(ToastHostComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
