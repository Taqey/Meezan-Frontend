import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LucideAngularModule, Search } from 'lucide-angular';

@Component({
  selector: 'mz-search-input',
  standalone: true,
  imports: [LucideAngularModule],
  host: { class: 'mz', style: 'display:block;width:100%' },
  templateUrl: './mz-search-input.component.html',
  styleUrl: './mz-search-input.component.css',
})
export class MzSearchInputComponent {
  readonly SearchIcon = Search;
  @Input() value = '';
  @Input() placeholder = '';
  @Input() ariaLabel = '';
  @Output() valueChange = new EventEmitter<string>();
}
