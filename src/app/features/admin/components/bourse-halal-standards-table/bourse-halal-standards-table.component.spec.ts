import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BourseHalalStandardsTableComponent } from './bourse-halal-standards-table.component';

describe('BourseHalalStandardsTableComponent', () => {
  let component: BourseHalalStandardsTableComponent;
  let fixture: ComponentFixture<BourseHalalStandardsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BourseHalalStandardsTableComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(BourseHalalStandardsTableComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
