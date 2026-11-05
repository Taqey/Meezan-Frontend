import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SectorsListComponent } from './sectors-list.component';

describe('SectorsListComponent', () => {
  let fixture: ComponentFixture<SectorsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectorsListComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(SectorsListComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
