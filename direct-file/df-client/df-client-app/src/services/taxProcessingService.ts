import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

export interface TaxDocument {
  id: string;
  name: string;
  type: string;
  content: string;
}

export interface ProcessedTaxData {
  grossIncome: number;
  deductions: number;
  taxableIncome: number;
  estimatedRefund: number;
  facts: Record<string, any>; // DirectFile fact graph format
}

export class TaxProcessingService {
  private static instance: TaxProcessingService;
  private constructor() {}

  public static getInstance(): TaxProcessingService {
    if (!TaxProcessingService.instance) {
      TaxProcessingService.instance = new TaxProcessingService();
    }
    return TaxProcessingService.instance;
  }

  async uploadDocument(file: File): Promise<TaxDocument> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_BASE_URL}/api/documents/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  async processDocuments(documents: TaxDocument[]): Promise<ProcessedTaxData> {
    const response = await axios.post(`${API_BASE_URL}/api/documents/process`, {
      documents,
    });

    return response.data;
  }

  async submitToDirectFile(processedData: ProcessedTaxData): Promise<{ submissionId: string }> {
    // Convert processed data to DirectFile's fact graph format
    const facts = this.mapToFactGraph(processedData);

    // Create tax return using DirectFile's API
    const createResponse = await axios.post(`${API_BASE_URL}/api/tax-returns`, {
      taxYear: new Date().getFullYear() - 1,
      facts,
    });

    // Submit the tax return
    const submitResponse = await axios.post(
      `${API_BASE_URL}/api/tax-returns/${createResponse.data.id}/submit`,
      {
        facts,
      }
    );

    return {
      submissionId: submitResponse.data.submissionId,
    };
  }

  private mapToFactGraph(processedData: ProcessedTaxData): Record<string, any> {
    // Map the processed data to DirectFile's fact graph format
    // This is a simplified example - you'll need to map to the actual fact graph schema
    return {
      '/primaryFiler/grossIncome': processedData.grossIncome,
      '/deductions/total': processedData.deductions,
      '/calculations/taxableIncome': processedData.taxableIncome,
      ...processedData.facts,
    };
  }
}

export const taxProcessingService = TaxProcessingService.getInstance();
