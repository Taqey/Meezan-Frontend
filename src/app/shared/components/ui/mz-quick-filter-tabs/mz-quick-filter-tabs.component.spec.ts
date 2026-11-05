import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MzQuickFilterTabsComponent } from './mz-quick-filter-tabs.component';

describe('MzQuickFilterTabsComponent', () => {
  let fixture: ComponentFixture<MzQuickFilterTabsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MzQuickFilterTabsComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(MzQuickFilterTabsComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
