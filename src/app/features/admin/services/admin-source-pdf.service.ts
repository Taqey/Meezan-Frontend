import { Injectable } from '@angular/core';
import { ApiService } from '../../../core/api/api.service';
import { SourcePdfStatusDto } from '../../../shared/models/api.models';

@Injectable({ providedIn: 'root' })
export class AdminSourcePdfService {
  constructor(
    private api: ApiService
  ) {}

  // PDF Upload tab
  selectedPdfSource: 'FaisalBank' | 'Ostoul' = 'FaisalBank';

  pdfReportDate = '';

  selectedPdfFile?: File;

  pdfUploading = false;

  pdfUploadResult?: { success: boolean; message: string; fileName?: string; storedAt?: string; uploadedAt?: string; reportDate?: string };

  pdfUploadError = '';

  sourcePdfStatuses: Record<string, SourcePdfStatusDto> = {};

  sourcePdfLoading = false;

  sourcePdfError = '';

  onPdfFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        alert('الملف يجب أن يكون بصيغة PDF');
        this.selectedPdfFile = undefined;
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        alert('حجم الملف يتجاوز 50 ميجابايت');
        this.selectedPdfFile = undefined;
        return;
      }
      this.selectedPdfFile = file;
      this.pdfUploadError = '';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' بايت';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' كيلوبايت';
    return (bytes / (1024 * 1024)).toFixed(1) + ' ميجابايت';
  }

  uploadPdfReport(): void {
    if (!this.selectedPdfFile) {
      this.pdfUploadError = 'الرجاء اختيار ملف PDF أولاً';
      return;
    }

    this.pdfUploading = true;
    this.pdfUploadError = '';
    this.pdfUploadResult = undefined;

    this.api.uploadSourcePdf(this.selectedPdfSource, this.selectedPdfFile, this.pdfReportDate || undefined).subscribe({
      next: (data) => {
        if (data.success) {
          this.pdfUploadResult = {
            success: true,
            message: data.message || '',
            fileName: data.fileName || undefined,
            storedAt: data.storedAt || undefined,
            uploadedAt: data.uploadedAt || undefined,
            reportDate: data.reportDate || undefined
          };
          this.pdfUploadError = '';
          this.selectedPdfFile = undefined;
          // Refresh stored-files status immediately (no stale cache).
          this.loadSourcePdfStatus();
        } else {
          this.pdfUploadError = data.message || 'فشل رفع الملف';
          this.pdfUploadResult = {
            success: false,
            message: data.message || 'فشل رفع الملف'
          };
        }
        this.pdfUploading = false;
      },
      error: (e) => {
        this.pdfUploadError = 'خطأ في الاتصال بالخادم: ' + (e?.message || e);
        this.pdfUploadResult = {
          success: false,
          message: 'خطأ في الاتصال بالخادم'
        };
        this.pdfUploading = false;
      }
    });
  }

  /**
   * Loads the stored-files status from the API (database record + file on
   * disk, per source). Never defaults to "not found": loading and error states
   * are surfaced explicitly in the template.
   */
  loadSourcePdfStatus(): void {
    this.sourcePdfLoading = true;
    this.sourcePdfError = '';
    this.api.getSourcePdfStatus().subscribe({
      next: (rows) => {
        const map: Record<string, SourcePdfStatusDto> = {};
        for (const row of rows || []) {
          if (row?.sourceKey) map[row.sourceKey] = row;
        }
        this.sourcePdfStatuses = map;
        this.sourcePdfLoading = false;
      },
      error: () => {
        this.sourcePdfLoading = false;
        this.sourcePdfError = 'تعذّر تحميل حالة الملفات المخزنة.';
      }
    });
  }

  getSourcePdfState(sourceKey: string): SourcePdfStatusDto | null {
    return this.sourcePdfStatuses[sourceKey] ?? null;
  }

  getSourcePdfViewUrl(sourceKey: string): string {
    return this.api.getSourcePdfUrl(sourceKey);
  }

  formatPdfDate(iso?: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleString();
  }
}
