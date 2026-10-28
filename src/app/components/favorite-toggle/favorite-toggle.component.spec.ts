import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FavoriteToggleComponent } from './favorite-toggle.component';

/** Two toggles for the same symbol: simulates the Stocks list + Favorites page sharing one store. */
@Component({
  standalone: true,
  imports: [FavoriteToggleComponent],
  template: `
    <app-favorite-toggle symbol="ABUK"></app-favorite-toggle>
    <app-favorite-toggle symbol="ABUK"></app-favorite-toggle>
  `
})
class ToggleHostComponent {}

describe('FavoriteToggleComponent', () => {
  let fixture: ComponentFixture<ToggleHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToggleHostComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(ToggleHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  function buttons(): HTMLButtonElement[] {
    return fixture.debugElement.queryAll(By.css('button.fav-toggle'))
      .map((el) => el.nativeElement as HTMLButtonElement);
  }

  it('renders an accessible unpressed toggle', () => {
    const [first] = buttons();
    expect(first.getAttribute('aria-pressed')).toBe('false');
    expect(first.getAttribute('aria-label')).toBe('إضافة إلى المفضلة');
  });

  it('toggling a star updates every instance bound to the same symbol', () => {
    const [first, second] = buttons();
    first.click();
    fixture.detectChanges();

    expect(first.getAttribute('aria-pressed')).toBe('true');
    expect(first.getAttribute('aria-label')).toBe('إزالة من المفضلة');
    expect(second.getAttribute('aria-pressed')).toBe('true');

    second.click();
    fixture.detectChanges();

    expect(first.getAttribute('aria-pressed')).toBe('false');
    expect(second.getAttribute('aria-pressed')).toBe('false');
  });
});
