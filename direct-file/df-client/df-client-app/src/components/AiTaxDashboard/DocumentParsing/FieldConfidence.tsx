import React, { useState } from 'react';
import { FiCheck, FiX, FiEdit, FiAlertTriangle } from 'react-icons/fi';
import type { ExtractedField } from '../../../types/documents';
import styles from './FieldConfidence.module.css';

interface FieldConfidenceProps {
  field: ExtractedField;
  onFieldUpdate?: (key: string, newValue: string | number) => void;
  isEditable?: boolean;
}

export const FieldConfidence: React.FC<FieldConfidenceProps> = ({ 
  field, 
  onFieldUpdate,
  isEditable = true 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(field.value?.toString() || '');

  const getConfidenceLevel = (confidence: number): 'high' | 'medium' | 'low' => {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return '#10b981'; // Green
    if (confidence >= 0.6) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  const formatValue = (value: string | number | null): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'number') {
      // Format currency values
      if (field.key.includes('wage') || field.key.includes('income') || field.key.includes('tax')) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
      }
      return value.toLocaleString();
    }
    return value.toString();
  };

  const handleSave = () => {
    if (onFieldUpdate) {
      // Try to parse as number if it looks like a currency or number
      let newValue: string | number = editValue;
      if (field.key.includes('wage') || field.key.includes('income') || field.key.includes('tax')) {
        const numericValue = parseFloat(editValue.replace(/[$,]/g, ''));
        if (!isNaN(numericValue)) {
          newValue = numericValue;
        }
      }
      onFieldUpdate(field.key, newValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(field.value?.toString() || '');
    setIsEditing(false);
  };

  const confidenceLevel = getConfidenceLevel(field.confidence);
  const confidenceColor = getConfidenceColor(field.confidence);

  return (
    <div className={`${styles.fieldContainer} ${styles[confidenceLevel]}`}>
      <div className={styles.fieldHeader}>
        <div className={styles.fieldLabel}>
          <span className={styles.labelText}>{field.label}</span>
          {field.confidence < 0.7 && (
            <span className={styles.reviewBadge}>Needs Review</span>
          )}
        </div>
        <div className={styles.confidenceIndicator}>
          <div 
            className={styles.confidenceBar}
            style={{ 
              width: `${field.confidence * 100}%`,
              backgroundColor: confidenceColor
            }}
          />
          <span className={styles.confidenceText}>
            {Math.round(field.confidence * 100)}%
          </span>
        </div>
      </div>

      <div className={styles.fieldValue}>
        {isEditing ? (
          <div className={styles.editMode}>
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className={styles.editInput}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
            />
            <div className={styles.editActions}>
              <button 
                onClick={handleSave}
                className={styles.saveButton}
                title="Save changes"
              >
                <FiCheck />
              </button>
              <button 
                onClick={handleCancel}
                className={styles.cancelButton}
                title="Cancel editing"
              >
                <FiX />
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.displayMode}>
            <span className={styles.valueText}>
              {formatValue(field.value)}
            </span>
            {isEditable && (
              <button 
                onClick={() => setIsEditing(true)}
                className={styles.editButton}
                title="Edit value"
              >
                <FiEdit />
              </button>
            )}
          </div>
        )}
      </div>

      {field.source?.textSnippet && (
        <div className={styles.sourceInfo}>
          <span className={styles.sourceLabel}>Source:</span>
          <span className={styles.sourceText}>"{field.source.textSnippet}"</span>
          {field.source.page && (
            <span className={styles.pageInfo}>Page {field.source.page}</span>
          )}
        </div>
      )}

      {field.confidence < 0.6 && (
        <div className={styles.warningMessage}>
          <FiAlertTriangle className={styles.warningIcon} />
          <span className={styles.warningText}>
            Low confidence - please verify this value carefully
          </span>
        </div>
      )}
    </div>
  );
};
