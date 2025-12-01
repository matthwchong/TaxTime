import React from 'react';
import styles from './DraftReturn.module.css';
import type { DraftReturn as DraftReturnType } from '../../../types/documents';

interface DraftReturnProps {
  draftReturn: DraftReturnType;
  onSubmit: () => void;
}

export const DraftReturn: React.FC<DraftReturnProps> = ({
  draftReturn,
  onSubmit
}) => {
  const formatCurrency = (amount: number | undefined): string => {
    if (amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getValidationIcon = (level: string): string => {
    switch (level) {
      case 'error': return '❌';
      case 'warn': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '';
    }
  };

  return (
    <div className={styles.draftReturn}>
      <div className={styles.header}>
        <h2>Draft Tax Return {draftReturn.taxYear}</h2>
        <p className={styles.subtitle}>Review your return before submission</p>
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <span className={styles.label}>Adjusted Gross Income</span>
          <span className={styles.amount}>{formatCurrency(draftReturn.totals.agi)}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.label}>Taxable Income</span>
          <span className={styles.amount}>{formatCurrency(draftReturn.totals.taxableIncome)}</span>
        </div>
        <div className={`${styles.summaryCard} ${draftReturn.totals.estimatedRefund ? styles.refund : styles.due}`}>
          <span className={styles.label}>
            {draftReturn.totals.estimatedRefund ? 'Estimated Refund' : 'Tax Due'}
          </span>
          <span className={styles.amount}>
            {formatCurrency(draftReturn.totals.estimatedRefund || draftReturn.totals.estimatedTaxDue)}
          </span>
        </div>
      </div>

      <div className={styles.sections}>
        {draftReturn.sections.map((section) => (
          <div key={section.id} className={styles.section}>
            <h3>{section.title}</h3>
            <div className={styles.fields}>
              {section.fields.map((field) => (
                <div key={field.key} className={styles.field}>
                  <span className={styles.fieldLabel}>{field.label}</span>
                  <span className={styles.fieldValue}>{field.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {draftReturn.validations.length > 0 && (
        <div className={styles.validations}>
          <h3>Validations</h3>
          {draftReturn.validations.map((validation, index) => (
            <div
              key={index}
              className={`${styles.validation} ${styles[validation.level]}`}
            >
              <span className={styles.icon}>
                {getValidationIcon(validation.level)}
              </span>
              <span className={styles.message}>{validation.message}</span>
            </div>
          ))}
        </div>
      )}

      <div className={styles.actions}>
        <button
          className={styles.submitButton}
          onClick={onSubmit}
          disabled={draftReturn.validations.some(v => v.level === 'error')}
        >
          Submit to IRS
        </button>
        <p className={styles.disclaimer}>
          By submitting, you confirm that all information is accurate and complete.
        </p>
      </div>
    </div>
  );
};
