import { Component, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaxEstimatorService, TaxInputs, EstimatedTaxData } from '@core/services/tax-estimator.service';
import { catchError, retry } from 'rxjs/operators';
import { of } from 'rxjs';

const QUARTERS_COUNT = 4;
const DUE_DAY = 15;
export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

@Component({
  selector: 'app-tax-estimator',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  templateUrl: './tax-estimator.component.html',
  styleUrls: ['./tax-estimator.component.scss']
})
export class TaxEstimatorComponent implements OnInit {
  taxInputs = signal<TaxInputs>({
    region: 'us',
    state: '',
    quarter: 'Q1',
    annualGrossIncome: 0,
    filingStatus: 'single',
    businessExpenses: 0,
    retirement: 0,
    healthInsurance: 0,
    homeOffice: 0
  });

  // Latest calculation for Tax Summary
  estimatedTaxData = signal<EstimatedTaxData & { totalTax?: number; quarterlyPayment?: number } | null>(null);

  // Array for Tax Calendar (all calculated quarters)
  estimatedTaxDataArray = signal<(EstimatedTaxData & { totalTax: number; quarterlyPayment: number; quarter: string })[]>([]);

  isCalculating = signal(false);
  errorMessage = signal('');
  quarters = [];

  readonly REGION_OPTIONS = [
    { code: 'us', label: 'United States (US)' },
    { code: 'in', label: 'India (IN)' },
    { code: 'ca', label: 'Canada (CA)' },
    { code: 'uk', label: 'United Kingdom (UK)' }
  ];

  readonly FILING_STATUSES = [
    { code: 'single', label: 'Single' },
    { code: 'married', label: 'Married' }
  ];

  readonly TAX_RESULT_ITEMS = [
    { key: 'taxableIncome', label: 'Taxable Income' },
    { key: 'totalTax', label: 'Total Tax' },
    { key: 'quarterlyPayment', label: 'Quarterly Payment' }
  ];

  readonly STATE_OPTIONS = {
    us: [
      { code: 'CA', label: 'California' },
      { code: 'NY', label: 'New York' },
      { code: 'TX', label: 'Texas' },
      { code: 'FL', label: 'Florida' }
    ],
    in: [
      { code: 'MH', label: 'Maharashtra' },
      { code: 'DL', label: 'Delhi' },
      { code: 'KA', label: 'Karnataka' },
      { code: 'TN', label: 'Tamil Nadu' }
    ],
    ca: [
      { code: 'ON', label: 'Ontario' },
      { code: 'QC', label: 'Quebec' },
      { code: 'BC', label: 'British Columbia' },
      { code: 'AB', label: 'Alberta' }
    ],
    uk: [
      { code: 'ENG', label: 'England' },
      { code: 'SCT', label: 'Scotland' },
      { code: 'WLS', label: 'Wales' },
      { code: 'NIR', label: 'Northern Ireland' }
    ]
  };

  readonly QUARTER_OPTIONS = [
    { code: 'Q1', label: 'Jan – Mar' },
    { code: 'Q2', label: 'Apr – Jun' },
    { code: 'Q3', label: 'Jul – Sep' },
    { code: 'Q4', label: 'Oct – Dec' }
  ];

  constructor(private taxService: TaxEstimatorService) {}

  ngOnInit() {
    this.quarters = this.generateStaticQuarters();

    // Load saved Tax Calendar from localStorage
    const saved = localStorage.getItem('taxEstimates');
    if (saved) this.estimatedTaxDataArray.set(JSON.parse(saved));
  }

  /** Hardcoded static quarters with due dates */
  private generateStaticQuarters() {
    return [
      { name: 'Q1', range: 'Jan – Mar 2025', dueDate: 'Apr 15, 2025' },
      { name: 'Q2', range: 'Apr – Jun 2025', dueDate: 'Jul 15, 2025' },
      { name: 'Q3', range: 'Jul – Sep 2025', dueDate: 'Oct 15, 2025' },
      { name: 'Q4', range: 'Oct – Dec 2025', dueDate: 'Jan 15, 2026' }
    ];
  }

  /** Calculate tax */
  calculateTax() {
    this.errorMessage.set('');
    this.isCalculating.set(true);
    const inputs = this.taxInputs();

    if (!inputs.annualGrossIncome || inputs.annualGrossIncome <= 0) {
      this.errorMessage.set('Please enter a valid gross income.');
      this.isCalculating.set(false);
      return;
    }

    this.taxService.calculateTax(inputs)
      .pipe(
        retry(2),
        catchError(err => {
          console.error(err);
          this.errorMessage.set('Failed to calculate tax. Please try again.');
          this.isCalculating.set(false);
          return of(null);
        })
      )
      .subscribe(res => {
        if (res) {
          const totalTax = res.estimatedTax;
          const quarterlyPayment = totalTax / 4;

          // Update latest calculation for Tax Summary only
          this.estimatedTaxData.set({ ...res, totalTax, quarterlyPayment });

          // Save/update Tax Calendar
          const updatedArray = [...this.estimatedTaxDataArray()];
          const index = updatedArray.findIndex(e => e.quarter === inputs.quarter);
          const newEntry = { ...res, totalTax, quarterlyPayment, quarter: inputs.quarter };

          if (index >= 0) updatedArray[index] = newEntry;
          else updatedArray.push(newEntry);

          this.estimatedTaxDataArray.set(updatedArray);
          localStorage.setItem('taxEstimates', JSON.stringify(updatedArray));
        }
        this.isCalculating.set(false);
      });
  }

  /** Get saved reminder for a quarter */
  getReminderForQuarter(quarter: string) {
    return this.estimatedTaxDataArray().find(e => e.quarter === quarter) ?? null;
  }
}
