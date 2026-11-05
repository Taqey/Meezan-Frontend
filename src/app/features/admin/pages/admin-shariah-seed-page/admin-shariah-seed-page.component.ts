import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, RefreshCw, Database, CheckCircle } from 'lucide-angular';
import { AdminShariahSeedService } from '../../services/admin-shariah-seed.service';

@Component({
  selector: 'app-admin-shariah-seed-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './admin-shariah-seed-page.component.html',
  styleUrl: './admin-shariah-seed-page.component.css'
})
export class AdminShariahSeedPageComponent {
  readonly RefreshCwIcon = RefreshCw;
  readonly DatabaseIcon = Database;
  readonly CheckCircleIcon = CheckCircle;
  constructor(public seed: AdminShariahSeedService) {}
}
