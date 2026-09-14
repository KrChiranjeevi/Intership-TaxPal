import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReportsService, Report } from '@core/services/reports.service';
import { REPORT_TYPES, PERIODS, FORMATS, FILE_ICON_URL } from '@core/constants/reports.constants';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent implements OnInit {
  fileIconUrl = FILE_ICON_URL;
  readonly REPORT_TYPES = REPORT_TYPES;
  readonly PERIODS = PERIODS;
  readonly FORMATS = FORMATS;


  // Form values
  reportTypeValue: string = this.REPORT_TYPES[0];
  periodValue: string = this.PERIODS[0];
  formatValue: string = this.FORMATS[0];

  recentReports: Report[] = [];
  selectedReport: Report | null = null;

  loading: boolean = false;

  constructor(private reportsService: ReportsService) {}

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.reportsService.getReports().subscribe({
      next: (res) => (this.recentReports = res),
      error: (err) => console.error(err),
    });
  }

  generateReport(): void {
    this.loading = true;

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!user.id) {
      console.error('User ID is missing. Make sure user is logged in.');
      this.loading = false;
      return;
    }

    const defaultFilePath = '/path/to/report.pdf';

    const newReport = {
      userId: user.id,
      reportType: this.reportTypeValue,
      period: this.periodValue,
      format: this.formatValue,
      
    };

    this.reportsService.createReport(newReport).subscribe({
      next: (res) => {
        this.recentReports.unshift(res);
        this.selectReport(res); // Auto-select and preview new report
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to create report:', err);
        this.loading = false;
      },
    });
  }

  private currentPreviewBlobUrl: string | null = null;

  resetForm(): void {
    this.reportTypeValue = this.REPORT_TYPES[0];
    this.periodValue = this.PERIODS[0];
    this.formatValue = this.FORMATS[0];
  }

  selectReport(report: Report): void {
    this.selectedReport = report;
    setTimeout(() => {
      this.previewReport(report);
    }, 0);
  }

  previewReport(report: Report): void {
    const container = document.getElementById('report-preview-container');
    if (!container) return;

    container.innerHTML = '<p style="padding: 1rem; color: #64748b;">Loading preview...</p>';

    this.reportsService.downloadReportFile(report.id).subscribe({
      next: (blob) => {
        if (this.currentPreviewBlobUrl) {
          URL.revokeObjectURL(this.currentPreviewBlobUrl);
          this.currentPreviewBlobUrl = null;
        }

        const format = report.format?.toUpperCase();
        if (format === 'PDF') {
          this.currentPreviewBlobUrl = URL.createObjectURL(blob);
          container.innerHTML = `<iframe src="${this.currentPreviewBlobUrl}" width="100%" height="550px" style="border: none; border-radius: 6px;"></iframe>`;
        } else if (format === 'CSV') {
          blob.text().then((data) => {
            container.innerHTML = `<pre style="width:100%;height:550px;overflow:auto;background:#fff;color:#1e293b;padding:12px;font-family:monospace;font-size:13px;border-radius:6px;margin:0;">${data}</pre>`;
          });
        } else {
          container.innerHTML = `<p style="padding: 1rem; color: #64748b;">Preview not supported for format: ${report.format}</p>`;
        }
      },
      error: (err) => {
        console.error('Error loading report preview:', err);
        container.innerHTML = '<p style="padding: 1rem; color: #ef4444;">Failed to load preview. Please try again.</p>';
      }
    });
  }

  updateReport(report: Report): void {
    if (!report) return;
    const updatedData = {
      reportType: this.reportTypeValue,
      period: this.periodValue,
      format: this.formatValue
    };
    this.reportsService.updateReport(report.id, updatedData).subscribe({
      next: (res) => {
        const index = this.recentReports.findIndex(r => r.id === report.id);
        if (index > -1) this.recentReports[index] = res;
        this.selectReport(res);
      },
      error: (err) => console.error(err)
    });
  }

  deleteReport(report: Report): void {
    if (!report) return;
    this.reportsService.deleteReport(report.id).subscribe({
      next: () => {
        this.recentReports = this.recentReports.filter(r => r.id !== report.id);
        if (this.selectedReport?.id === report.id) {
          if (this.currentPreviewBlobUrl) {
            URL.revokeObjectURL(this.currentPreviewBlobUrl);
            this.currentPreviewBlobUrl = null;
          }
          this.selectedReport = null;
        }
      },
      error: (err) => console.error(err)
    });
  }

  downloadReport(): void {
    if (!this.selectedReport) return;

    this.reportsService.downloadReportFile(this.selectedReport.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const ext = this.selectedReport?.format?.toLowerCase() === 'csv' ? 'csv' : 'pdf';
        const fileName = (this.selectedReport?.name || 'report').replace(/\s+/g, '_');
        a.download = `${fileName}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Failed to download report:', err)
    });
  }

  printReport(): void {
    if (!this.selectedReport) return;

    const container = document.getElementById('report-preview-container');
    if (!container) return;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write('<html><head><title>Print Report</title></head><body>');
    printWindow.document.write(container.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }
}
