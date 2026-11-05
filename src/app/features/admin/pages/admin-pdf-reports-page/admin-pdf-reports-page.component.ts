import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminSourcePdfService } from '../../services/admin-source-pdf.service';
import { SourcePdfStatusCardComponent } from '../../components/source-pdf-status-card/source-pdf-status-card.component';
import { PdfUploadFormComponent } from '../../components/pdf-upload-form/pdf-upload-form.component';

@Component({
  selector: 'app-admin-pdf-reports-page',
  standalone: true,
  imports: [CommonModule, SourcePdfStatusCardComponent, PdfUploadFormComponent],
  templateUrl: './admin-pdf-reports-page.component.html',
  styleUrl: './admin-pdf-reports-page.component.css'
})
export class AdminPdfReportsPageComponent implements OnInit {
  constructor(public pdf: AdminSourcePdfService) {}
  ngOnInit(): void { this.pdf.loadSourcePdfStatus(); }
}
