import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { IndicesListComponent } from './indices-list.component';

describe('IndicesListComponent', () => {
  let fixture: ComponentFixture<IndicesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IndicesListComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(IndicesListComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
