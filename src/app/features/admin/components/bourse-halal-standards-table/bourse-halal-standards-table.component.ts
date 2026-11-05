import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, CheckCircle } from 'lucide-angular';
import { AdminShariahOverridesService } from '../../services/admin-shariah-overrides.service';

@Component({
  selector: 'app-bourse-halal-standards-table',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './bourse-halal-standards-table.component.html',
  styleUrl: './bourse-halal-standards-table.component.css'
})
export class BourseHalalStandardsTableComponent {
  readonly CheckCircleIcon = CheckCircle;
  constructor(public overrides: AdminShariahOverridesService) {}
}
