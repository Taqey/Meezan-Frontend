import { Injectable } from '@angular/core';
import { ApiService } from '../../../core/api/api.service';
import { IndexSummaryDto, UploadIndexFileResultDto } from '../../../shared/models/api.models';

@Injectable({ providedIn: 'root' })
export class AdminIndexUploadService {
  constructor(
    private api: ApiService
  ) {}

  indices: IndexSummaryDto[] = [];

  // Upload tab
  selectedUploadIndex = '';

  uploadFile?: File;

  uploading = false;

  uploadResult?: UploadIndexFileResultDto;

  loadIndices(): void {
    this.api.getIndices().subscribe({
      next: (data) => (this.indices = data || [])
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.uploadFile = file;
    }
  }

  onUploadSubmit(event: Event): void {
    event.preventDefault();
    if (!this.selectedUploadIndex || !this.uploadFile) return;

    this.uploading = true;
    this.uploadResult = undefined;

    this.api.uploadIndexFile(this.selectedUploadIndex, this.uploadFile).subscribe({
      next: (res) => {
        this.uploadResult = res;
        this.uploading = false;
        this.loadIndices();
      },
      error: (err) => {
        this.uploadResult = {
          indexCode: this.selectedUploadIndex,
          inserted: 0,
          updated: 0,
          skipped: 0,
          totalConstituents: 0,
          skippedDetails: [],
          status: 'Failed',
          message: err.error?.message || err.message || 'حدث خطأ أثناء معالجة ملف الإكسيل.'
        };
        this.uploading = false;
      }
    });
  }
}
