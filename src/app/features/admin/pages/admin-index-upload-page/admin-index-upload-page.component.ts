import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Upload } from 'lucide-angular';
import { AdminIndexUploadService } from '../../services/admin-index-upload.service';

@Component({
  selector: 'app-admin-index-upload-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './admin-index-upload-page.component.html',
  styleUrl: './admin-index-upload-page.component.css'
})
export class AdminIndexUploadPageComponent {
  readonly UploadIcon = Upload;
  constructor(public indexUpload: AdminIndexUploadService) {}
  ngOnInit(): void { this.indexUpload.loadIndices(); }
}
