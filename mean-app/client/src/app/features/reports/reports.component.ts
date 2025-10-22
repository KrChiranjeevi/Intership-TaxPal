import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReportsService, Report } from '@core/services/reports.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent implements OnInit {
  fileIconUrl = 'https://cdn-icons-png.flaticon.com/512/7945/7945212.png';
  readonly REPORT_TYPES = ['Income Statement', 'Expense Report', 'Balance Sheet'];
  readonly PERIODS = ['Current Month', 'Last Month', 'Quarter', 'Year'];
  readonly FORMATS = ['PDF', 'CSV'];

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
      filePath: defaultFilePath,
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
    this.previewReport(report.fileUrl, report.format);
  }

  previewReport(fileUrl: string, format: string) {
    const container = document.getElementById('report-preview-container');
    if (!container) return;

    if (format === 'PDF') {
      container.innerHTML = `<iframe src="${fileUrl}" width="100%" height="500px"></iframe>`;
    } else if (format === 'CSV') {
      fetch(fileUrl)
        .then(res => res.text())
        .then(data => {
          const rows = data
            .split('\n')
            .map(r => `<tr>${r.split(',').map(c => `<td>${c}</td>`).join('')}</tr>`)
            .join('');
          container.innerHTML = `<table border="1" style="width:100%; border-collapse:collapse;">${rows}</table>`;
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
    window.open(this.selectedReport.filePath || this.selectedReport.fileUrl, '_blank');
  }

  printReport(): void {
    if (!this.selectedReport) return;
    window.print();
  }
}
