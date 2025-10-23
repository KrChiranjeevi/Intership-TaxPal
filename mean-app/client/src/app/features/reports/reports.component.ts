// // client/src/app/features/reports/reports.component.ts

// import { Component } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { ReportsService } from '@core/services/reports.service';

// @Component({
//   selector: 'app-reports',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './reports.component.html',
//   styleUrls: ['./reports.component.scss']
// })
// export class ReportsComponent {
//   reportType = 'Income Statement';
//   period = 'Current Month';
//   format = 'JSON'; // Default to JSON for display
//   generatedReportData: any = null;
//   reportMessage: string | null = null;

//   constructor(private reportsService: ReportsService) {}

//   generateReport() {
//     this.reportMessage = 'Generating report...';
//     const reportOptions = {
//       reportType: this.reportType,
//       period: this.period,
//       format: this.format
//     };
    
//     this.reportsService.generateReport(reportOptions).subscribe(
//       (res: any) => {
//         this.reportMessage = 'Report generated successfully!';
//         if (this.format === 'CSV') {
//             // Handle CSV download
//             const blob = new Blob([res], { type: 'text/csv' });
//             const url = window.URL.createObjectURL(blob);
//             const a = document.createElement('a');
//             a.href = url;
//             a.download = `TaxPal_${this.reportType}_${this.period}.csv`;
//             document.body.appendChild(a);
//             a.click();
//             window.URL.revokeObjectURL(url);
//             a.remove();
//             this.generatedReportData = null; // CSV is downloaded, no display needed
//         } else {
//             // Display JSON report data
//             this.generatedReportData = res.data;
//         }
//       },
//       (err) => {
//         this.reportMessage = 'Failed to generate report.';
//         this.generatedReportData = null;
//         console.error('Failed to generate report:', err);
//         alert('Report generation failed. Check console for details.');
//       }
//     );
//   }

//   // Helper to display data clearly
//   getReportDisplay() {
//       if (!this.generatedReportData) return '';
//       if (Array.isArray(this.generatedReportData) && this.generatedReportData.length > 0) {
//           return JSON.stringify(this.generatedReportData, null, 2);
//       } else if (this.generatedReportData.totalIncome !== undefined) {
//           return JSON.stringify(this.generatedReportData, null, 2);
//       }
//       return 'No specific data returned for JSON report.';
//   }
// }