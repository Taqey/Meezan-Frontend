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
  templateUrl: './app.component.html',
})
export class AppComponent {}
