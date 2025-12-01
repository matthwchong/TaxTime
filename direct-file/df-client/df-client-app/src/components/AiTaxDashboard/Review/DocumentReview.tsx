import React from 'react';
import styles from './DocumentReview.module.css';
import type { ExtractedDocument } from '../../../types/documents';
import { FieldConfidence } from '../DocumentParsing/FieldConfidence';

interface DocumentReviewProps {
  document: ExtractedDocument;
  onFieldUpdate: (fieldKey: string, newValue: string | number) => void;
}

export const DocumentReview: React.FC<DocumentReviewProps> = ({
  document,
  onFieldUpdate
}) => {
  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'W2':
        return 'W-2 Form';
      case '1099_INT':
        return '1099-INT Form';
      case '1099_DIV':
        return '1099-DIV Form';
      case '1099_NEC':
        return '1099-NEC Form';
      case '1098_E':
        return '1098-E Form';
      case 'UNKNOWN':
        return 'Unknown Document';
      default:
        return type;
    }
  };

  return (
    <div className={styles.documentReview}>
      <div className={styles.header}>
        <h2>{getDocumentTypeLabel(document.type)} Review</h2>
        <p className={styles.subtitle}>Review and edit extracted information</p>
        <div className={styles.stats}>
          <span className={styles.fieldCount}>
            {document.fields.length} fields extracted
          </span>
          <span className={styles.needsReview}>
            {document.fields.filter(f => f.confidence < 0.7).length} need review
          </span>
        </div>
      </div>

      <div className={styles.fields}>
        {document.fields.map((field) => (
          <FieldConfidence
            key={field.key}
            field={field}
            onFieldUpdate={onFieldUpdate}
            isEditable={true}
          />
        ))}
      </div>

      {document.fields.length === 0 && (
        <div className={styles.emptyState}>
          <p>No fields were extracted from this document.</p>
          <p className={styles.hint}>
            This might be due to poor image quality or an unsupported document type.
          </p>
        </div>
      )}
    </div>
  );
};
