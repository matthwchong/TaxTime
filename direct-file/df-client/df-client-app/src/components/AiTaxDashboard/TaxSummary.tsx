import React from 'react';
import styles from './TaxSummary.module.css';

interface TaxSummaryProps {
  summary: {
    grossIncome: number;
    deductions: number;
    taxableIncome: number;
    estimatedRefund: number;
  };
}

export const TaxSummary: React.FC<TaxSummaryProps> = ({ summary }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className={styles.summary}>
      <h2>Tax Summary</h2>
      <div className={styles.grid}>
        <div className={styles.item}>
          <label>Gross Income</label>
          <span>{formatCurrency(summary.grossIncome)}</span>
        </div>
        <div className={styles.item}>
          <label>Deductions</label>
          <span>{formatCurrency(summary.deductions)}</span>
        </div>
        <div className={styles.item}>
          <label>Taxable Income</label>
          <span>{formatCurrency(summary.taxableIncome)}</span>
        </div>
        <div className={`${styles.item} ${styles.refund}`}>
          <label>Estimated Refund</label>
          <span>{formatCurrency(summary.estimatedRefund)}</span>
        </div>
      </div>
    </div>
  );
};
