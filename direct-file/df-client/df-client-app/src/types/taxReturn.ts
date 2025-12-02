export interface TaxReturn {
  id: string;
  taxYear: number;
  status: 'DRAFT' | 'SUBMITTED' | 'PROCESSING' | 'ACCEPTED' | 'REJECTED' | 'REFUND_ISSUED';
  createdDate: string;
  lastModified: string;
  submittedDate?: string;
  filingStatus: 'SINGLE' | 'MARRIED_FILING_JOINTLY' | 'MARRIED_FILING_SEPARATELY' | 'HEAD_OF_HOUSEHOLD' | 'QUALIFYING_SURVIVING_SPOUSE';
  estimatedRefund?: number;
  estimatedTaxDue?: number;
  totalIncome: number;
  adjustedGrossIncome?: number;
  taxableIncome?: number;
  federalTax?: number;
  totalWithholdings: number;
  progress: number; // 0-100
  personalInfo?: {
    firstName: string;
    lastName: string;
    ssn: string;
    address: any;
    email: string;
    phone: string;
  };
  incomeSources?: Array<{
    type: string;
    description: string;
    amount: number;
    employer: string;
  }>;
  timeline?: Array<{
    date: string;
    status: string;
    description: string;
  }>;
  draftFilingData?: any; // Complete filing data for draft restoration
}

export interface TaxReturnSummary {
  totalReturns: number;
  draftReturns: number;
  filedReturns: number;
  acceptedReturns: number;
  totalRefunds: number;
  currentYearStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}
