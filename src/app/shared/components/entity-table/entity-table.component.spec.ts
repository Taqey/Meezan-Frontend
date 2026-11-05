import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { EntityTableComponent } from './entity-table.component';

describe('EntityTableComponent', () => {
  let fixture: ComponentFixture<EntityTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityTableComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(EntityTableComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
