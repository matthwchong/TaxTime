// OCR Provider implementations for different services

interface OCRResult {
  text: string;
  confidence: number;
  boundingBoxes?: Array<{
    text: string;
    bbox: [number, number, number, number];
    confidence: number;
  }>;
}

interface OCRProvider {
  extractText(file: File): Promise<OCRResult>;
}

// Tesseract.js OCR Provider (Client-side OCR)
export class TesseractOCRProvider implements OCRProvider {
  private worker: any = null;

  async initialize(): Promise<void> {
    if (typeof window !== 'undefined') {
      try {
        // Dynamic import for client-side only
        const Tesseract = await import('tesseract.js');
        this.worker = await Tesseract.createWorker('eng');
      } catch (error) {
        console.error('Failed to initialize Tesseract:', error);
        throw new Error('OCR initialization failed');
      }
    }
  }

  async extractText(file: File): Promise<OCRResult> {
    try {
      if (!this.worker) {
        console.log('Initializing Tesseract OCR worker...');
        await this.initialize();
      }

      if (!this.worker) {
        console.error('OCR worker failed to initialize');
        throw new Error('OCR worker not available');
      }

      console.log(`Starting OCR processing for file: ${file.name}`);
      const { data } = await this.worker.recognize(file);
      
      console.log(`OCR completed. Confidence: ${data.confidence}%, Text length: ${data.text?.length || 0}`);
      console.log('Extracted text preview:', data.text?.substring(0, 200) + '...');
      
      return {
        text: data.text || '',
        confidence: (data.confidence || 0) / 100, // Convert to 0-1 scale
        boundingBoxes: data.words?.map((word: any) => ({
          text: word.text || '',
          bbox: [
            (word.bbox?.x0 || 0) / (data.width || 1) * 100,
            (word.bbox?.y0 || 0) / (data.height || 1) * 100,
            ((word.bbox?.x1 || 0) - (word.bbox?.x0 || 0)) / (data.width || 1) * 100,
            ((word.bbox?.y1 || 0) - (word.bbox?.y0 || 0)) / (data.height || 1) * 100
          ],
          confidence: (word.confidence || 0) / 100
        })) || []
      };
    } catch (error) {
      console.error('Tesseract OCR failed:', error);
      throw new Error(`OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      try {
        await this.worker.terminate();
      } catch (error) {
        console.error('Error terminating OCR worker:', error);
      }
      this.worker = null;
    }
  }
}

// AWS Textract OCR Provider (Server-side integration)
export class AWSTextractProvider implements OCRProvider {
  private apiEndpoint: string;

  constructor(apiEndpoint: string = '/api/ocr/textract') {
    this.apiEndpoint = apiEndpoint;
  }

  async extractText(file: File): Promise<OCRResult> {
    const formData = new FormData();
    formData.append('document', file);

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      return {
        text: result.text,
        confidence: result.confidence,
        boundingBoxes: result.boundingBoxes
      };
    } catch (error) {
      console.error('AWS Textract failed:', error);
      throw new Error('OCR processing failed');
    }
  }
}

// Google Cloud Vision OCR Provider
export class GoogleVisionProvider implements OCRProvider {
  private apiEndpoint: string;

  constructor(apiEndpoint: string = '/api/ocr/vision') {
    this.apiEndpoint = apiEndpoint;
  }

  async extractText(file: File): Promise<OCRResult> {
    // Convert file to base64
    const base64 = await this.fileToBase64(file);

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: base64,
          features: ['TEXT_DETECTION', 'DOCUMENT_TEXT_DETECTION']
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      return {
        text: result.text,
        confidence: result.confidence,
        boundingBoxes: result.boundingBoxes
      };
    } catch (error) {
      console.error('Google Vision OCR failed:', error);
      throw new Error('OCR processing failed');
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }
}

// Simple PDF Text Extractor (mock for now)
export class PDFTextExtractor {
  async extractTextFromPDF(file: File): Promise<string> {
    // For now, just return empty string for PDFs
    // In production, you'd use a server-side PDF parser
    console.log('PDF text extraction not implemented, using OCR instead');
    return '';
  }
}

// Hybrid OCR Provider that combines multiple methods
export class HybridOCRProvider implements OCRProvider {
  private tesseractProvider: TesseractOCRProvider;
  private fallbackProvider?: OCRProvider;

  constructor(fallbackProvider?: OCRProvider) {
    this.tesseractProvider = new TesseractOCRProvider();
    this.fallbackProvider = fallbackProvider;
  }

  async extractText(file: File): Promise<OCRResult> {
    try {
      // Use OCR for all file types (PDFs and images)
      const ocrResult = await this.tesseractProvider.extractText(file);
      
      // If confidence is too low and we have a fallback, try it
      if (ocrResult.confidence < 0.7 && this.fallbackProvider) {
        try {
          const fallbackResult = await this.fallbackProvider.extractText(file);
          // Use the result with higher confidence
          return fallbackResult.confidence > ocrResult.confidence ? fallbackResult : ocrResult;
        } catch (error) {
          console.log('Fallback OCR failed, using primary result');
        }
      }

      return ocrResult;
    } catch (error) {
      console.error('OCR failed, returning mock result:', error);
      // Return a mock result instead of throwing
      return {
        text: `Unable to extract text from ${file.name}. Please verify the document is clear and readable.`,
        confidence: 0.1,
        boundingBoxes: []
      };
    }
  }

  async terminate(): Promise<void> {
    await this.tesseractProvider.terminate();
  }
}

// Factory function to create the best available OCR provider
export function createOCRProvider(): OCRProvider {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    try {
      // For development, use Tesseract.js
      // For production, you might want to use a server-side service
      return new HybridOCRProvider();
    } catch (error) {
      console.warn('Failed to create OCR provider, falling back to mock');
      // Return a simple mock provider if real OCR fails
      return {
        async extractText(file: File): Promise<OCRResult> {
          return {
            text: `Mock OCR result for ${file.name}`,
            confidence: 0.5,
            boundingBoxes: []
          };
        }
      };
    }
  }
  
  // For server-side, return a mock provider
  return {
    async extractText(file: File): Promise<OCRResult> {
      return {
        text: `Server-side mock OCR result for ${file.name}`,
        confidence: 0.5,
        boundingBoxes: []
      };
    }
  };
}
