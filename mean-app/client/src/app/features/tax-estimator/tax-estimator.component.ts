import { Component, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaxEstimatorService, TaxInputs, EstimatedTaxData } from '@core/services/tax-estimator.service';
import { catchError, retry } from 'rxjs/operators';
import { of } from 'rxjs';
import { 
  QUARTERS_COUNT, DUE_DAY, MONTH_NAMES, REGION_OPTIONS, 
  FILING_STATUSES, TAX_RESULT_ITEMS, STATE_OPTIONS, QUARTER_OPTIONS, STATIC_QUARTERS 
} from '@core/constants/tax-estimator.constants';

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
  readonly QUARTERS_COUNT = QUARTERS_COUNT;
  readonly DUE_DAY = DUE_DAY;
  readonly MONTH_NAMES = MONTH_NAMES;
  // Latest calculation for Tax Summary
  estimatedTaxData = signal<EstimatedTaxData & { totalTax?: number; quarterlyPayment?: number } | null>(null);

  // Array for Tax Calendar (all calculated quarters)
  estimatedTaxDataArray = signal<(EstimatedTaxData & { totalTax: number; quarterlyPayment: number; quarter: string;paid?: boolean })[]>([]);

  isCalculating = signal(false);
  errorMessage = signal('');
  quarters = STATIC_QUARTERS;

  readonly REGION_OPTIONS = REGION_OPTIONS;
  readonly FILING_STATUSES = FILING_STATUSES;
  readonly TAX_RESULT_ITEMS = TAX_RESULT_ITEMS;
  readonly STATE_OPTIONS = STATE_OPTIONS;
  readonly QUARTER_OPTIONS = QUARTER_OPTIONS;

  constructor(private taxService: TaxEstimatorService) {}

  ngOnInit() {
    this.quarters = this.generateStaticQuarters();

    // Load saved Tax Calendar from localStorage
    const saved = localStorage.getItem('taxEstimates');
    if (saved) this.estimatedTaxDataArray.set(JSON.parse(saved));
  }

  /** Hardcoded static quarters with due dates */
  private generateStaticQuarters() {
    return STATIC_QUARTERS;
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
          //const index = updatedArray.findIndex(e => e.quarter === inputs.quarter);
          const newEntry = { ...res, totalTax, quarterlyPayment, quarter: inputs.quarter };
          updatedArray.push(newEntry);
          //if (index >= 0) updatedArray[index] = newEntry;
          //else updatedArray.push(newEntry);

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
