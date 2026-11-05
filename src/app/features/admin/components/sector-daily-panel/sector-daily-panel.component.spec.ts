import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SectorDailyPanelComponent } from './sector-daily-panel.component';

describe('SectorDailyPanelComponent', () => {
  let component: SectorDailyPanelComponent;
  let fixture: ComponentFixture<SectorDailyPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectorDailyPanelComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(SectorDailyPanelComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
