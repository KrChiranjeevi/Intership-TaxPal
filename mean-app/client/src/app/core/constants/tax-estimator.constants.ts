// src/app/core/constants/tax-estimator.constants.ts

export const QUARTERS_COUNT = 4;
export const DUE_DAY = 15;

export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const REGION_OPTIONS = [
  { code: 'us', label: 'United States (US)' },
  { code: 'in', label: 'India (IN)' },
  { code: 'ca', label: 'Canada (CA)' },
  { code: 'uk', label: 'United Kingdom (UK)' }
];

export const FILING_STATUSES = [
  { code: 'single', label: 'Single' },
  { code: 'married', label: 'Married' }
];

export const TAX_RESULT_ITEMS = [
  { key: 'taxableIncome', label: 'Taxable Income' },
  { key: 'totalTax', label: 'Total Tax' },
  { key: 'quarterlyPayment', label: 'Quarterly Payment' }
];

export const STATE_OPTIONS = {
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

export const QUARTER_OPTIONS = [
  { code: 'Q1', label: 'Jan – Mar' },
  { code: 'Q2', label: 'Apr – Jun' },
  { code: 'Q3', label: 'Jul – Sep' },
  { code: 'Q4', label: 'Oct – Dec' }
];

export const STATIC_QUARTERS = [
  { name: 'Q1', range: 'Jan – Mar 2025', dueDate: 'Apr 15, 2025' },
  { name: 'Q2', range: 'Apr – Jun 2025', dueDate: 'Jul 15, 2025' },
  { name: 'Q3', range: 'Jul – Sep 2025', dueDate: 'Oct 15, 2025' },
  { name: 'Q4', range: 'Oct – Dec 2025', dueDate: 'Jan 15, 2026' }
];
