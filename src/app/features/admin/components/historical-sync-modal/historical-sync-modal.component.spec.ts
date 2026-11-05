import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HistoricalSyncModalComponent } from './historical-sync-modal.component';

describe('HistoricalSyncModalComponent', () => {
  let component: HistoricalSyncModalComponent;
  let fixture: ComponentFixture<HistoricalSyncModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoricalSyncModalComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(HistoricalSyncModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
