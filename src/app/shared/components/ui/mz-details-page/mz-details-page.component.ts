import { Component } from '@angular/core';

/* ───────────── DetailsPage layout (stack of sections) ───────────── */
@Component({
  selector: 'mz-details-page',
  standalone: true,
  host: { class: 'mz mz-stack', style: 'display:flex' },
  templateUrl: './mz-details-page.component.html',
  styleUrl: './mz-details-page.component.css',
})
export class MzDetailsPageComponent {}
