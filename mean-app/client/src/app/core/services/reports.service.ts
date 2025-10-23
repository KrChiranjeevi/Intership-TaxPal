// // client/src/app/core/services/reports.service.ts

// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { environment } from '../../../environments/environment';
// import { Observable } from 'rxjs';

// @Injectable({ providedIn: 'root' })
// export class ReportsService {
//   private api = environment.apiUrl + '/reports';

//   constructor(private http: HttpClient) {}

//   generateReport(reportOptions: any): Observable<any> {
//     // Send report options (type, period, format) to the backend
//     return this.http.post(`${this.api}/generate`, reportOptions, {
//         // Set response type to text/blob for file downloads (like CSV/PDF)
//         responseType: reportOptions.format === 'CSV' ? 'text' : 'json' 
//     });
//   }
// }