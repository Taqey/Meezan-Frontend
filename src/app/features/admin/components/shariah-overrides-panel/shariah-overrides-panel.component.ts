import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Edit3, Save, RotateCcw } from 'lucide-angular';
import { AdminShariahOverridesService } from '../../services/admin-shariah-overrides.service';

@Component({
  selector: 'app-shariah-overrides-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './shariah-overrides-panel.component.html',
  styleUrl: './shariah-overrides-panel.component.css'
})
export class ShariahOverridesPanelComponent {
  readonly Edit3Icon = Edit3;
  readonly SaveIcon = Save;
  readonly RotateCcwIcon = RotateCcw;
  constructor(public overrides: AdminShariahOverridesService) {}
}
