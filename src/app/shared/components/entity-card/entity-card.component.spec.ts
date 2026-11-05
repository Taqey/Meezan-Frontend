import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { EntityCardComponent } from './entity-card.component';

describe('EntityCardComponent', () => {
  let fixture: ComponentFixture<EntityCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityCardComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(EntityCardComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
