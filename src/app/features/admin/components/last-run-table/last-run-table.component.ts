import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, History } from 'lucide-angular';
import { AdminScrapingJobsService } from '../../services/admin-scraping-jobs.service';

@Component({
  selector: 'app-last-run-table',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './last-run-table.component.html',
  styleUrl: './last-run-table.component.css'
})
export class LastRunTableComponent {
  readonly HistoryIcon = History;
  constructor(public jobs: AdminScrapingJobsService) {}
}
