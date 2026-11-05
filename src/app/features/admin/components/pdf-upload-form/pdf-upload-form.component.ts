import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Upload as UploadIcon } from 'lucide-angular';
import { AdminSourcePdfService } from '../../services/admin-source-pdf.service';

@Component({
  selector: 'app-pdf-upload-form',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './pdf-upload-form.component.html',
  styleUrl: './pdf-upload-form.component.css'
})
export class PdfUploadFormComponent {
  readonly UploadFileIcon = UploadIcon;
  constructor(public pdf: AdminSourcePdfService) {}
}
