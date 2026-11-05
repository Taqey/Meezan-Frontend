import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminSourcePdfService } from '../../services/admin-source-pdf.service';

@Component({
  selector: 'app-source-pdf-status-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './source-pdf-status-card.component.html',
  styleUrl: './source-pdf-status-card.component.css'
})
export class SourcePdfStatusCardComponent {
  constructor(public pdf: AdminSourcePdfService) {}
}
