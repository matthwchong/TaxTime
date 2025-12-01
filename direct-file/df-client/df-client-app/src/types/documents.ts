export type TaxYear = 2024 | 2025;
export type DocType = 'W2' | '1099_INT' | '1099_DIV' | '1099_NEC' | '1098_E' | 'UNKNOWN';

export interface UploadedDocument {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  type: DocType;
  pageCount: number;
  status: 'UPLOADED' | 'PROCESSING' | 'PARSED' | 'ERROR';
  createdAt: string;
  updatedAt: string;
}

export interface ExtractedField {
  key: string;                 // e.g., wages, federal_tax_withheld
  label: string;               // UI label
  value: string | number | null;
  confidence: number;          // 0..1
  source?: {
    documentId: string;
    page: number;
    bbox?: [number, number, number, number]; // percent coords
    textSnippet?: string;
  };
}

export interface ExtractedDocument {
  documentId: string;
  type: DocType;
  fields: ExtractedField[];
}

export interface DraftReturnSection {
  id: 'income' | 'adjustments' | 'credits' | 'payments' | 'totals';
  title: string;
  fields: ExtractedField[]; // normalized keys
}

export interface DraftReturn {
  id: string;
  taxYear: TaxYear;
  sections: DraftReturnSection[];
  totals: {
    agi?: number;
    taxableIncome?: number;
    estimatedRefund?: number;
    estimatedTaxDue?: number;
  };
  validations: Array<{ 
    level: 'info' | 'warn' | 'error'; 
    message: string; 
    fieldKey?: string;
  }>;
}
