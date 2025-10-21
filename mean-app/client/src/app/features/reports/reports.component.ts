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

    // Get logged-in user from localStorage (replace with your auth logic if different)
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!user.id) {
      console.error('User ID is missing. Make sure user is logged in.');
      this.loading = false;
      return;
    }

    // Default filePath for testing
    const defaultFilePath = '/path/to/report.pdf';

    const newReport = {
      userId: user.id,                  // required by backend
      reportType: this.reportTypeValue,
      period: this.periodValue,
      format: this.formatValue,
      filePath: defaultFilePath,        // required by backend
    };

    console.log('Sending report to backend:', newReport);

    this.reportsService.createReport(newReport).subscribe({
      next: (res) => {
        this.recentReports.unshift(res);
        this.selectedReport = res;
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
  }

  downloadReport(): void {
    if (!this.selectedReport) return;
    // Assuming your backend returns filePath or fileUrl
    window.open(this.selectedReport.filePath || this.selectedReport.fileUrl, '_blank');
  }

  printReport(): void {
    if (!this.selectedReport) return;
    window.print();
  }
}
