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

    console.log('Sending report to backend:', newReport);

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

  resetForm(): void {
    this.reportTypeValue = this.REPORT_TYPES[0];
    this.periodValue = this.PERIODS[0];
    this.formatValue = this.FORMATS[0];
  }

  selectReport(report: Report): void {
    this.selectedReport = report;
    this.previewReport(report.filePath, report.format);
  }

  previewReport(fileUrl: string, format: string) {
  const container = document.getElementById('report-preview-container');
  if (!container) return;

  // Add your backend base URL
  const backendBaseUrl = 'http://localhost:5000';
  const timestamp = new Date().getTime();
  if (format === 'PDF') {
  
  container.innerHTML = `<iframe src="${backendBaseUrl}${encodeURI(fileUrl)}?t=${timestamp}" width="100%" height="500px"></iframe>`;
}
 else if (format === 'CSV') {
  fetch(`${backendBaseUrl}${encodeURI(fileUrl)}`)
    .then(res => res.text())
    .then(data => {
      container.innerHTML = `<pre style="width:100%;height:500px;overflow:auto;background:#fff;color:#000;padding:10px;font-family:monospace;">${data}</pre>`;
    });
}

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
        if (this.selectedReport?.id === report.id) this.selectedReport = null;
      },
      error: (err) => console.error(err)
    });
  }

  downloadReport(): void {
  if (!this.selectedReport) return;

  const backendBaseUrl = 'http://localhost:5000';
  const fileUrl = `${backendBaseUrl}${encodeURI(this.selectedReport.filePath)}`;

  // Open in new tab for browser default download behavior
  window.open(fileUrl, '_blank');
}


  printReport(): void {
  if (!this.selectedReport) return;

  const container = document.getElementById('report-preview-container');
  if (!container) return;

  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (!printWindow) return;

  // Clone the preview HTML for printing
  printWindow.document.write('<html><head><title>Print Report</title></head><body>');
  printWindow.document.write(container.innerHTML);
  printWindow.document.write('</body></html>');
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

}
