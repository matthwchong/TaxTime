import { 
  UploadedDocument, 
  ExtractedDocument, 
  DraftReturn,
  DocType 
} from '../types/documents.js';
import { DocumentParsingService } from './documentParsingService.js';

// Mock latency simulation
const MOCK_LATENCY = 1000;
const simulateDelay = () => new Promise(resolve => setTimeout(resolve, MOCK_LATENCY));

class MockTaxProcessingService {
  private documents: UploadedDocument[] = [];
  private extractions: ExtractedDocument[] = [];
  private draftReturn: DraftReturn | null = null;
  private parsingService: DocumentParsingService;
  private uploadedFiles: Map<string, File> = new Map(); // Store files for parsing

  constructor() {
    this.parsingService = new DocumentParsingService(false); // Use hardcoded mock data
  }

  // Helper to generate mock document data
  private createMockDocument(file: File): UploadedDocument {
    return {
      id: Math.random().toString(36).substr(2, 9),
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      type: this.guessDocumentType(file.name),
      pageCount: 1,
      status: 'UPLOADED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // Improved document type detection
  private guessDocumentType(filename: string): DocType {
    const lower = filename.toLowerCase();
    
    // Check for explicit form names in filename
    if (lower.includes('w2') || lower.includes('w-2') || lower.includes('wage')) return 'W2';
    if (lower.includes('1099')) {
      if (lower.includes('nec') || lower.includes('nonemployee')) return '1099_NEC';
      if (lower.includes('int') || lower.includes('interest')) return '1099_INT';
      if (lower.includes('div') || lower.includes('dividend')) return '1099_DIV';
      return '1099_NEC'; // Default 1099 type to NEC
    }
    if (lower.includes('1098') || lower.includes('student')) return '1098_E';
    
    // Check for contractor/freelancer related terms
    if (lower.includes('contractor') || lower.includes('freelance') || lower.includes('independent')) return '1099_NEC';
    
    // For uploaded tax documents without clear naming, assume W-2 (most common)
    // The OCR will determine the actual type during processing
    if (lower.includes('tax') || lower.includes('form') || lower.includes('irs')) return 'W2';
    
    // Default to W2 for any uploaded document (will be corrected during OCR)
    return 'W2';
  }

  // Mock field extraction based on document type
  private extractFieldsForDocument(doc: UploadedDocument): ExtractedDocument {
    const mockFields = {
      'W2': [
        { key: 'wages', label: 'Wages & Salaries', value: 75000, confidence: 0.95 },
        { key: 'federal_tax_withheld', label: 'Federal Tax Withheld', value: 15000, confidence: 0.92 }
      ],
      '1099_INT': [
        { key: 'interest_income', label: 'Interest Income', value: 1200, confidence: 0.88 },
        { key: 'tax_withheld', label: 'Tax Withheld', value: 240, confidence: 0.85 }
      ]
    };

    return {
      documentId: doc.id,
      type: doc.type,
      fields: (mockFields[doc.type as keyof typeof mockFields] || []).map(field => ({
        ...field,
        source: {
          documentId: doc.id,
          page: 1,
          bbox: [10, 10, 90, 20],
          textSnippet: `Original text for ${field.label}`
        }
      }))
    };
  }

  async uploadDocuments(files: File[]): Promise<UploadedDocument[]> {
    await simulateDelay();
    
    const newDocs = files.map(file => {
      const doc = this.createMockDocument(file);
      this.uploadedFiles.set(doc.id, file); // Store file for later parsing
      return doc;
    });
    this.documents.push(...newDocs);
    
    return newDocs;
  }

  async processDocuments(documentIds: string[]): Promise<ExtractedDocument[]> {
    await simulateDelay();
    
    const docsToProcess = this.documents.filter(doc => documentIds.includes(doc.id));
    const newExtractions: ExtractedDocument[] = [];
    
    for (const doc of docsToProcess) {
      try {
        const file = this.uploadedFiles.get(doc.id);
        if (file) {
          console.log(`Processing document: ${file.name}, size: ${file.size} bytes`);
          // Use the robust parsing service
          const extraction = await this.parsingService.parseDocument(file, doc.id);
          console.log(`Extracted ${extraction.fields.length} fields from ${extraction.type} document:`, extraction.fields);
          newExtractions.push(extraction);
          doc.status = 'PARSED';
          doc.type = extraction.type; // Update type based on parsing results
        } else {
          // Fallback to mock extraction if file not found
          const extraction = this.extractFieldsForDocument(doc);
          newExtractions.push(extraction);
          doc.status = 'PARSED';
        }
      } catch (error) {
        console.error(`Failed to process document ${doc.id}:`, error);
        doc.status = 'ERROR';
        // Still add a basic extraction with error info
        newExtractions.push({
          documentId: doc.id,
          type: doc.type,
          fields: [{
            key: 'error',
            label: 'Processing Error',
            value: 'Failed to parse document',
            confidence: 0.1,
            source: {
              documentId: doc.id,
              page: 1,
              textSnippet: 'Error occurred during processing'
            }
          }]
        });
      }
    }
    
    this.extractions.push(...newExtractions);
    return newExtractions;
  }

  async generateDraftReturn(): Promise<DraftReturn> {
    await simulateDelay();

    // Aggregate all extracted fields into sections
    const allFields = this.extractions.flatMap(doc => doc.fields);
    
    this.draftReturn = {
      id: Math.random().toString(36).substr(2, 9),
      taxYear: 2024,
      sections: [
        {
          id: 'income',
          title: 'Income',
          fields: allFields.filter(f => ['wages', 'interest_income'].includes(f.key))
        },
        {
          id: 'payments',
          title: 'Payments & Credits',
          fields: allFields.filter(f => ['federal_tax_withheld', 'tax_withheld'].includes(f.key))
        }
      ],
      totals: {
        agi: allFields.reduce((sum, field) => sum + (Number(field.value) || 0), 0),
        estimatedRefund: 2500
      },
      validations: []
    };

    return this.draftReturn;
  }

  async getDocuments(): Promise<UploadedDocument[]> {
    await simulateDelay();
    return this.documents;
  }

  async getExtractions(): Promise<ExtractedDocument[]> {
    await simulateDelay();
    return this.extractions;
  }

  async getDraftReturn(): Promise<DraftReturn | null> {
    await simulateDelay();
    return this.draftReturn;
  }

  // Method to enable real OCR processing
  enableRealOCR(): void {
    this.parsingService = new DocumentParsingService(true);
  }

  // Method to get parsing service for direct use
  getParsingService(): DocumentParsingService {
    return this.parsingService;
  }

  // Method to get supported document types
  getSupportedDocumentTypes(): DocType[] {
    return this.parsingService.getSupportedTypes();
  }
}

export const mockTaxProcessingService = new MockTaxProcessingService();
