import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TreemapComponent } from './treemap.component';

describe('TreemapComponent', () => {
  let fixture: ComponentFixture<TreemapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreemapComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(TreemapComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
