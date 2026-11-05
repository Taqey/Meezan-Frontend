import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, FileText } from 'lucide-angular';
import { MzStatusTagComponent } from '../mz-status-tag/mz-status-tag.component';
import { type MzAuthority } from '../models/mz-authority.model';

@Component({
  selector: 'mz-authority-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MzStatusTagComponent],
  host: { class: 'mz mz-authority-host' },
  templateUrl: './mz-authority-card.component.html',
})
export class MzAuthorityCardComponent {
  readonly FileTextIcon = FileText;
  @Input() authority!: MzAuthority;
  @Output() action = new EventEmitter<void>();
}
