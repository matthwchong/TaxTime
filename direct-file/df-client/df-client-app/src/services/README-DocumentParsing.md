# Document Parsing System

This directory contains a robust document parsing system for extracting tax information from various document types like W-2s, 1099s, and other tax forms.

## Architecture

### Core Components

1. **DocumentParsingService** (`documentParsingService.ts`)
   - Main orchestrator for document parsing
   - Handles OCR, document type detection, and field extraction
   - Supports multiple OCR providers and parsing strategies

2. **OCR Providers** (`ocrProviders.ts`)
   - Pluggable OCR implementations
   - Supports Tesseract.js (client-side), AWS Textract, Google Vision
   - Hybrid approach for best results

3. **Form Parsers** (`formParsers.ts`)
   - Specialized parsers for different tax forms
   - Pattern-based field extraction with validation
   - Confidence scoring for extracted data

## Supported Document Types

- **W-2**: Wage and Tax Statement
- **1099-INT**: Interest Income
- **1099-DIV**: Dividends and Distributions  
- **1099-NEC**: Nonemployee Compensation
- **1098-E**: Student Loan Interest Statement

## Usage

### Basic Document Processing

```typescript
import { DocumentParsingService } from './documentParsingService';

const parsingService = new DocumentParsingService();

// Parse a single document
const result = await parsingService.parseDocument(file, documentId);
console.log('Extracted fields:', result.fields);

// Batch process multiple documents
const results = await parsingService.parseMultipleDocuments([
  { file: file1, documentId: 'doc1' },
  { file: file2, documentId: 'doc2' }
]);
```

### Using Real OCR (Production)

```typescript
// Enable real OCR processing
const parsingService = new DocumentParsingService(true);

// Or switch OCR provider
import { TesseractOCRProvider } from './ocrProviders';
const ocrProvider = new TesseractOCRProvider();
await ocrProvider.initialize();
parsingService.setOCRProvider(ocrProvider);
```

### Custom Form Parsers

```typescript
import { TaxFormParser, createFormParser } from './formParsers';

// Create a custom parser
class Custom1040Parser extends TaxFormParser {
  formType = 'CUSTOM' as DocType;
  
  fieldPatterns = [
    {
      key: 'totalIncome',
      label: 'Total Income',
      patterns: [/total.*income[:\s]*\$?([\d,]+\.?\d*)/i],
      type: 'currency',
      required: true
    }
  ];
}

// Use the parser
const parser = new Custom1040Parser();
const fields = parser.parseDocument(ocrResult);
```

## Field Extraction

### Field Types

- **currency**: Monetary amounts (automatically formatted)
- **text**: General text fields
- **ssn**: Social Security Numbers (validated format)
- **ein**: Employer Identification Numbers
- **date**: Date fields (normalized format)

### Confidence Scoring

Each extracted field includes a confidence score (0-1):

- **≥ 0.8**: High confidence (green)
- **0.6-0.79**: Medium confidence (amber)  
- **< 0.6**: Low confidence (red, needs review)

### Field Structure

```typescript
interface ExtractedField {
  key: string;           // Unique field identifier
  label: string;         // Human-readable label
  value: string | number | null;  // Extracted value
  confidence: number;    // Confidence score (0-1)
  source?: {
    documentId: string;
    page: number;
    bbox?: [number, number, number, number];  // Bounding box
    textSnippet?: string; // Original text
  };
}
```

## UI Components

### ParsingProgress

Shows document processing status with retry functionality:

```tsx
<ParsingProgress 
  documents={documents}
  onRetryParsing={handleRetry}
/>
```

### FieldConfidence

Displays extracted fields with confidence indicators and inline editing:

```tsx
<FieldConfidence
  field={extractedField}
  onFieldUpdate={handleFieldUpdate}
  isEditable={true}
/>
```

## Error Handling

The system includes robust error handling:

1. **OCR Failures**: Falls back to alternative OCR providers
2. **Parsing Errors**: Returns partial results with error fields
3. **Document Type Detection**: Handles unknown document types gracefully
4. **Validation**: Validates extracted values against expected patterns

## Performance Considerations

1. **Client-side OCR**: Use Tesseract.js for development/testing
2. **Server-side OCR**: Use AWS Textract or Google Vision for production
3. **PDF Text Extraction**: Attempts native text extraction before OCR
4. **Batch Processing**: Processes multiple documents in parallel

## Configuration

### Environment Variables

```bash
# OCR Provider selection
REACT_APP_OCR_PROVIDER=tesseract|textract|vision

# Mock vs Real OCR
REACT_APP_USE_MOCK_OCR=false

# Confidence thresholds
REACT_APP_MIN_CONFIDENCE=0.6
```

### Customization

1. **Add New Document Types**: Extend `documentTypePatterns` in `documentParsingService.ts`
2. **Custom OCR Providers**: Implement the `OCRProvider` interface
3. **Field Validation**: Add custom validation functions to field patterns
4. **Post-processing**: Override `postProcessFields` in form parsers

## Integration with DirectFile

The parsed fields can be mapped to DirectFile's Fact Graph format:

```typescript
const mapToFactGraph = (fields: ExtractedField[]) => {
  const facts: { [key: string]: any } = {};
  
  fields.forEach(field => {
    if (field.key === 'wages') {
      facts['/primaryFiler/wages'] = {
        "$type": "gov.irs.factgraph.persisters.NumberWrapper",
        "item": field.value
      };
    }
    // ... more mappings
  });
  
  return facts;
};
```

## Testing

The system includes comprehensive test coverage:

1. **Unit Tests**: Individual parser and OCR provider tests
2. **Integration Tests**: End-to-end document processing
3. **Mock Data**: Realistic test documents and expected outputs
4. **Performance Tests**: OCR processing speed and accuracy

## Future Enhancements

1. **Machine Learning**: Train custom models for better field detection
2. **Template Matching**: Use document templates for improved accuracy
3. **Multi-language Support**: Support for non-English tax documents
4. **Real-time Processing**: Stream processing for large document batches
5. **Advanced Validation**: Cross-field validation and business rules
