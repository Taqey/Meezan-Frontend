import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { PriceFlashDirective } from './price-flash.directive';

@Component({
  standalone: true,
  imports: [PriceFlashDirective],
  template: `<strong [appPriceFlash]="price">10.00</strong>`
})
class FlashHostComponent {
  price: number | null = 10;
}

describe('PriceFlashDirective', () => {
  async function create(): Promise<ComponentFixture<FlashHostComponent>> {
    await TestBed.configureTestingModule({ imports: [FlashHostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(FlashHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  function elOf(fixture: ComponentFixture<FlashHostComponent>): HTMLElement {
    return fixture.debugElement.query(By.css('strong')).nativeElement as HTMLElement;
  }

  it('never flashes on first render', async () => {
    const fixture = await create();
    const el = elOf(fixture);
    expect(el.classList.contains('flash-up')).toBeFalse();
    expect(el.classList.contains('flash-down')).toBeFalse();
  });

  it('flashes green on increase and red on decrease, then clears', fakeAsync(async () => {
    const fixture = await create();
    const el = elOf(fixture);

    fixture.componentInstance.price = 12;
    fixture.detectChanges();
    tick();
    expect(el.classList.contains('flash-up')).toBeTrue();

    tick(700);
    fixture.detectChanges();
    expect(el.classList.contains('flash-up')).toBeFalse();

    fixture.componentInstance.price = 9;
    fixture.detectChanges();
    tick();
    expect(el.classList.contains('flash-down')).toBeTrue();

    tick(700);
    fixture.detectChanges();
    expect(el.classList.contains('flash-down')).toBeFalse();
  }));

  it('does not flash when the value is unchanged or becomes null', fakeAsync(async () => {
    const fixture = await create();
    const el = elOf(fixture);

    fixture.detectChanges();
    tick();
    expect(el.classList.contains('flash-up')).toBeFalse();

    fixture.componentInstance.price = null;
    fixture.detectChanges();
    tick();
    expect(el.classList.contains('flash-up')).toBeFalse();
    expect(el.classList.contains('flash-down')).toBeFalse();
  }));
});
