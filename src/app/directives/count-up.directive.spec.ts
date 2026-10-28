import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CountUpDirective } from './count-up.directive';

type IoCallback = (entries: Array<{ isIntersecting: boolean }>) => void;

@Component({
  standalone: true,
  imports: [CountUpDirective],
  template: `<strong [appCountUp]="value" [decimals]="1" [duration]="60"></strong>`
})
class CountUpHostComponent {
  value: number | null = 234;
}

describe('CountUpDirective', () => {
  let callback: IoCallback | null = null;

  beforeEach(() => {
    callback = null;
    (window as unknown as Record<string, unknown>)['IntersectionObserver'] =
      class {
        constructor(cb: IoCallback) {
          callback = cb;
        }
        observe(): void {}
        disconnect(): void {}
        unobserve(): void {}
      };
  });

  afterEach(() => {
    delete (window as unknown as Record<string, unknown>)['IntersectionObserver'];
  });

  async function create(): Promise<ComponentFixture<CountUpHostComponent>> {
    await TestBed.configureTestingModule({ imports: [CountUpHostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(CountUpHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  function textOf(fixture: ComponentFixture<CountUpHostComponent>): string {
    return (fixture.debugElement.query(By.css('strong')).nativeElement as HTMLElement).textContent ?? '';
  }

  it('counts up to the target with the requested decimals', async () => {
    const fixture = await create();
    callback?.([{ isIntersecting: true }]);
    await new Promise((r) => setTimeout(r, 250));
    fixture.detectChanges();
    expect(textOf(fixture)).toBe('234.0');
  });

  it('re-animates when the target changes after being shown', async () => {
    const fixture = await create();
    callback?.([{ isIntersecting: true }]);
    await new Promise((r) => setTimeout(r, 250));
    fixture.componentInstance.value = 100;
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 250));
    fixture.detectChanges();
    expect(textOf(fixture)).toBe('100.0');
  });
});
