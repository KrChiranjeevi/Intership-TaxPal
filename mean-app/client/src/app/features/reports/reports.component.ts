import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  ReportsService,
  Report,
  ReportFilters,
  ReportSummary,
  ReportTransaction
} from '@core/services/reports.service';
import {
  REPORT_TYPES,
  PERIODS,
  FORMATS,
  TRANSACTION_TYPES,
  FILE_ICON_URL
} from '@core/constants/reports.constants';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent implements OnInit, OnDestroy {
  fileIconUrl = FILE_ICON_URL;
  readonly REPORT_TYPES = REPORT_TYPES;
  readonly PERIODS = PERIODS;
  readonly FORMATS = FORMATS;
  readonly TRANSACTION_TYPES = TRANSACTION_TYPES;

  // Filter & Form state
  reportTypeValue: string = this.REPORT_TYPES[0] ?? 'Financial Report';
  periodValue: string = this.PERIODS[0] ?? 'Current Month';
  formatValue: string = this.FORMATS[0] ?? 'PDF';
  startDate: string = '';
  endDate: string = '';
  transactionTypeValue: 'all' | 'income' | 'expense' = 'all';
  categoryValue: string = '';

  // Summary & Preview state
  summary: ReportSummary | null = null;
  previewTransactions: ReportTransaction[] = [];
  previewLoading: boolean = false;
  previewError: string | null = null;

  // Report generation & UI action state
  generateLoading: boolean = false;
  actionMessage: string | null = null;
  actionError: string | null = null;

  // Recent reports & preview modal/panel state
  recentReports: Report[] = [];
  selectedReport: Report | null = null;
  selectedReportSafeUrl: SafeResourceUrl | null = null;
  selectedReportCsvData: string | null = null;
  reportPreviewLoading: boolean = false;
  private currentRawBlobUrl: string | null = null;

  // Delete confirmation modal state
  reportToDelete: Report | null = null;
  deleteLoading: boolean = false;

  constructor(
    private reportsService: ReportsService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadReports();
    this.loadPreview();
  }

  ngOnDestroy(): void {
    this.revokeBlobUrl();
  }

  /**
   * Load the list of generated reports for the current user.
   */
  loadReports(): void {
    this.reportsService.getReports().subscribe({
      next: (res) => (this.recentReports = res),
      error: (err) => {
        console.error('Failed to load reports:', err);
      },
    });
  }

  /**
   * Handle filter changes and trigger real-time preview.
   */
  onFilterChange(): void {
    this.actionMessage = null;
    this.actionError = null;

    if (this.periodValue === 'Custom') {
      if (this.startDate && this.endDate) {
        if (this.startDate > this.endDate) {
          this.previewError = 'Start date cannot be after end date.';
          return;
        }
        this.loadPreview();
      }
    } else {
      this.loadPreview();
    }
  }

  /**
   * Fetch backend summary and filtered transactions for preview.
   */
  loadPreview(): void {
    this.previewLoading = true;
    this.previewError = null;

    const filters: ReportFilters = {
      period: this.periodValue,
      type: this.transactionTypeValue,
      category: this.categoryValue.trim() || undefined
    };

    if (this.periodValue === 'Custom' && this.startDate && this.endDate) {
      filters.startDate = this.startDate;
      filters.endDate = this.endDate;
    }

    this.reportsService.getReportPreview(filters).subscribe({
      next: (res) => {
        this.summary = res.summary;
        this.previewTransactions = res.transactions;
        this.previewLoading = false;
      },
      error: (err) => {
        console.error('Preview load error:', err);
        this.previewError = err.error?.message || 'Failed to load report preview';
        this.previewLoading = false;
      }
    });
  }

  /**
   * Reset filter inputs back to defaults.
   */
  resetFilters(): void {
    this.reportTypeValue = this.REPORT_TYPES[0] ?? 'Financial Report';
    this.periodValue = this.PERIODS[0] ?? 'Current Month';
    this.formatValue = this.FORMATS[0] ?? 'PDF';
    this.startDate = '';
    this.endDate = '';
    this.transactionTypeValue = 'all';
    this.categoryValue = '';
    this.actionMessage = null;
    this.actionError = null;
    this.loadPreview();
  }

  /**
   * Generate a report file on the backend with current filters and format.
   */
  generateReport(): void {
    if (this.periodValue === 'Custom') {
      if (!this.startDate || !this.endDate) {
        this.actionError = 'Please select both start and end dates for custom date range.';
        return;
      }
      if (this.startDate > this.endDate) {
        this.actionError = 'Start date cannot be after end date.';
        return;
      }
    }

    this.generateLoading = true;
    this.actionMessage = null;
    this.actionError = null;

    const reportData: Partial<Report> & ReportFilters = {
      reportType: this.reportTypeValue,
      period: this.periodValue,
      format: this.formatValue,
      type: this.transactionTypeValue,
      category: this.categoryValue.trim() || undefined
    };

    if (this.periodValue === 'Custom') {
      reportData.startDate = this.startDate;
      reportData.endDate = this.endDate;
    }

    this.reportsService.createReport(reportData).subscribe({
      next: (res) => {
        this.recentReports.unshift(res);
        this.actionMessage = `Report "${res.name}" generated successfully!`;
        this.selectReport(res);
        this.generateLoading = false;
      },
      error: (err) => {
        console.error('Report generation error:', err);
        this.actionError = err.error?.message || 'Failed to generate report.';
        this.generateLoading = false;
      }
    });
  }

  /**
   * Quick export helper: sets format and automatically generates & downloads report.
   */
  quickExport(format: 'PDF' | 'CSV'): void {
    this.formatValue = format;
    this.generateReport();
  }

  /**
   * View / Preview a generated report safely in the preview pane.
   */
  selectReport(report: Report): void {
    this.revokeBlobUrl();
    this.selectedReport = report;
    this.selectedReportSafeUrl = null;
    this.selectedReportCsvData = null;
    this.reportPreviewLoading = true;

    this.reportsService.downloadReportFile(report.id).subscribe({
      next: (blob) => {
        const format = report.format?.toUpperCase();

        if (format === 'PDF') {
          const blobUrl = URL.createObjectURL(blob);
          this.currentRawBlobUrl = blobUrl;
          this.selectedReportSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl);
        } else if (format === 'CSV') {
          blob.text().then((text) => {
            this.selectedReportCsvData = text;
          });
        }
        this.reportPreviewLoading = false;
      },
      error: (err) => {
        console.error('Failed to load report file for preview:', err);
        this.actionError = 'Failed to load report preview file from server.';
        this.reportPreviewLoading = false;
      }
    });
  }

  /**
   * Download a report file securely through authenticated streaming.
   */
  downloadReport(report?: Report): void {
    const target = report || this.selectedReport;
    if (!target) return;

    this.reportsService.downloadReportFile(target.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const ext = target.format?.toLowerCase() === 'csv' ? 'csv' : 'pdf';
        const sanitizedName = (target.name || 'taxpal_report').replace(/[^a-zA-Z0-9_-]/g, '_');
        a.download = `${sanitizedName}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      },
      error: (err) => {
        console.error('Download report error:', err);
        this.actionError = 'Failed to download report file.';
      }
    });
  }

  /**
   * Print report safely without document.write or raw innerHTML.
   */
  printReport(): void {
    if (!this.selectedReport) return;

    if (this.currentRawBlobUrl && this.selectedReport.format?.toUpperCase() === 'PDF') {
      const printWindow = window.open(this.currentRawBlobUrl, '_blank');
      if (printWindow) {
        printWindow.focus();
      }
    } else {
      window.print();
    }
  }

  /**
   * Request confirmation to delete a report.
   */
  requestDelete(report: Report): void {
    this.reportToDelete = report;
  }

  cancelDelete(): void {
    this.reportToDelete = null;
  }

  confirmDelete(): void {
    if (!this.reportToDelete) return;

    const id = this.reportToDelete.id;
    this.deleteLoading = true;

    this.reportsService.deleteReport(id).subscribe({
      next: () => {
        this.recentReports = this.recentReports.filter((r) => r.id !== id);
        if (this.selectedReport?.id === id) {
          this.revokeBlobUrl();
          this.selectedReport = null;
          this.selectedReportSafeUrl = null;
          this.selectedReportCsvData = null;
        }
        this.reportToDelete = null;
        this.deleteLoading = false;
        this.actionMessage = 'Report deleted successfully.';
      },
      error: (err) => {
        console.error('Failed to delete report:', err);
        this.actionError = 'Failed to delete report.';
        this.deleteLoading = false;
      }
    });
  }

  private revokeBlobUrl(): void {
    if (this.currentRawBlobUrl) {
      URL.revokeObjectURL(this.currentRawBlobUrl);
      this.currentRawBlobUrl = null;
    }
  }
}
