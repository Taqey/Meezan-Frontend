import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { JobCardComponent } from './job-card.component';

describe('JobCardComponent', () => {
  let component: JobCardComponent;
  let fixture: ComponentFixture<JobCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobCardComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(JobCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
