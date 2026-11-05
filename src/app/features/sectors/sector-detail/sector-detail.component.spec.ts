import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SectorDetailComponent } from './sector-detail.component';

describe('SectorDetailComponent', () => {
  let fixture: ComponentFixture<SectorDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectorDetailComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(SectorDetailComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
