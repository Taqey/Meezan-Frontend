import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { LastRunTableComponent } from './last-run-table.component';

describe('LastRunTableComponent', () => {
  let component: LastRunTableComponent;
  let fixture: ComponentFixture<LastRunTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LastRunTableComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(LastRunTableComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
