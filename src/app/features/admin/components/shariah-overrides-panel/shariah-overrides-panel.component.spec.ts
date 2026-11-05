import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ShariahOverridesPanelComponent } from './shariah-overrides-panel.component';

describe('ShariahOverridesPanelComponent', () => {
  let component: ShariahOverridesPanelComponent;
  let fixture: ComponentFixture<ShariahOverridesPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShariahOverridesPanelComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(ShariahOverridesPanelComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
