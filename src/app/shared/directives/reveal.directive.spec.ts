import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RevealDirective } from './reveal.directive';

type IoCallback = (entries: Array<{ isIntersecting: boolean }>) => void;

@Component({
  standalone: true,
  imports: [RevealDirective],
  template: `<div appReveal class="box">hello</div>`
})
class RevealHostComponent {}

describe('RevealDirective', () => {
  let observed: Element | null = null;
  let callback: IoCallback | null = null;
  let disconnects = 0;

  beforeEach(() => {
    observed = null;
    callback = null;
    disconnects = 0;
    (window as unknown as Record<string, unknown>)['IntersectionObserver'] =
      class {
        constructor(cb: IoCallback) {
          callback = cb;
        }
        observe = (el: Element): void => {
          observed = el;
        };
        disconnect(): void {
          disconnects++;
        }
        unobserve(): void {}
      };
  });

  afterEach(() => {
    delete (window as unknown as Record<string, unknown>)['IntersectionObserver'];
  });

  async function create(): Promise<ComponentFixture<RevealHostComponent>> {
    await TestBed.configureTestingModule({ imports: [RevealHostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(RevealHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  it('starts hidden and reveals once the element enters the viewport', async () => {
    const fixture = await create();
    const box = fixture.debugElement.query(By.css('.box')).nativeElement as HTMLElement;
    expect(observed).toBe(box);
    expect(box.classList.contains('reveal')).toBeTrue();
    expect(box.classList.contains('revealed')).toBeFalse();

    callback?.([{ isIntersecting: true }]);
    fixture.detectChanges();
    expect(box.classList.contains('revealed')).toBeTrue();
    // Once-only: the observer disconnects on first reveal and never refires.
    expect(disconnects).toBeGreaterThan(0);
  });

  it('stays hidden while outside the viewport', async () => {
    const fixture = await create();
    const box = fixture.debugElement.query(By.css('.box')).nativeElement as HTMLElement;
    callback?.([{ isIntersecting: false }]);
    fixture.detectChanges();
    expect(box.classList.contains('revealed')).toBeFalse();
  });
});
