import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Root shell only. Page chrome lives in the layout components:
 * PublicLayoutComponent (public header/footer) and AdminLayoutComponent
 * (admin sidebar/top bar). The login page renders with no shell at all.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`
})
export class AppComponent {}
