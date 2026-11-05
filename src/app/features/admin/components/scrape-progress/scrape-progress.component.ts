import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminScrapingJobsService } from '../../services/admin-scraping-jobs.service';

@Component({
  selector: 'app-scrape-progress',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './scrape-progress.component.html',
  styleUrl: './scrape-progress.component.css'
})
export class ScrapeProgressComponent {
  constructor(public jobs: AdminScrapingJobsService) {}
}
