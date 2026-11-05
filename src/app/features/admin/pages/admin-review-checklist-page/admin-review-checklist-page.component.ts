import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, RefreshCw, Play, AlertTriangle, RotateCcw } from 'lucide-angular';
import { AdminRemovalCandidatesService } from '../../services/admin-removal-candidates.service';

@Component({
  selector: 'app-admin-review-checklist-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './admin-review-checklist-page.component.html',
  styleUrl: './admin-review-checklist-page.component.css'
})
export class AdminReviewChecklistPageComponent {
  readonly RefreshCwIcon = RefreshCw;
  readonly PlayIcon = Play;
  readonly AlertTriangleIcon = AlertTriangle;
  readonly RotateCcwIcon = RotateCcw;
  constructor(public review: AdminRemovalCandidatesService) {}
  ngOnInit(): void { this.review.loadRemovalCandidates(); }
}
