import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ShariahStandardsComponent } from './shariah-standards.component';

describe('ShariahStandardsComponent', () => {
  let fixture: ComponentFixture<ShariahStandardsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShariahStandardsComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(ShariahStandardsComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
