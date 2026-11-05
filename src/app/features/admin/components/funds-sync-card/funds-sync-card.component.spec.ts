import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FundsSyncCardComponent } from './funds-sync-card.component';

describe('FundsSyncCardComponent', () => {
  let component: FundsSyncCardComponent;
  let fixture: ComponentFixture<FundsSyncCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundsSyncCardComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(FundsSyncCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
