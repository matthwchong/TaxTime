import React from 'react';
import styles from './FinalReview.module.css';
import type { TaxFilingData, FilingStatus } from '../../../types/filing';

interface FinalReviewProps {
  filingData: TaxFilingData;
  onSubmit: () => void;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

const formatFilingStatus = (status: FilingStatus): string => {
  return status.replace(/_/g, ' ');
};

export const FinalReview: React.FC<FinalReviewProps> = ({
  filingData,
  onSubmit
}) => {
  // Calculate totals
  const totalIncome = filingData.incomeSources.reduce((sum, source) => sum + source.amount, 0);
  const totalDeductions = filingData.deductions.reduce((sum, deduction) => sum + deduction.amount, 0);
  const totalCredits = filingData.credits.reduce((sum, credit) => sum + credit.amount, 0);
  const totalPayments = filingData.payments.reduce((sum, payment) => sum + payment.amount, 0);

  const taxableIncome = Math.max(totalIncome - totalDeductions, 0);
  // Simple tax calculation for demo purposes
  const estimatedTax = Math.round(taxableIncome * 0.22); // Using 22% bracket as example
  const estimatedRefund = totalPayments + totalCredits - estimatedTax;

  return (
    <div className={styles.finalReview}>
      <div className={styles.header}>
        <h2>Final Review</h2>
        <p>Please review your information carefully before submitting</p>
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <span className={styles.label}>Estimated Refund</span>
          <span className={`${styles.amount} ${estimatedRefund >= 0 ? styles.positive : styles.negative}`}>
            {formatCurrency(Math.abs(estimatedRefund))}
            {estimatedRefund >= 0 ? ' Refund' : ' Due'}
          </span>
        </div>
      </div>

      <div className={styles.sections}>
        <section className={styles.section}>
          <h3>Personal Information</h3>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label>Name</label>
              <span>{filingData.personalInfo.firstName} {filingData.personalInfo.lastName}</span>
            </div>
            <div className={styles.field}>
              <label>SSN</label>
              <span>***-**-{filingData.personalInfo.ssn.slice(-4)}</span>
            </div>
            <div className={styles.field}>
              <label>Filing Status</label>
              <span>{formatFilingStatus(filingData.filingStatus)}</span>
            </div>
            <div className={styles.field}>
              <label>Address</label>
              <span>
                {filingData.personalInfo.address.street}<br />
                {filingData.personalInfo.address.city}, {filingData.personalInfo.address.state} {filingData.personalInfo.address.zipCode}
              </span>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h3>Income Sources</h3>
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span>Source</span>
              <span>Type</span>
              <span>Amount</span>
            </div>
            {filingData.incomeSources.map((source, index) => (
              <div key={index} className={styles.tableRow}>
                <span>{source.source}</span>
                <span>{source.type}</span>
                <span>{formatCurrency(source.amount)}</span>
              </div>
            ))}
            <div className={styles.tableFooter}>
              <span>Total Income</span>
              <span>{formatCurrency(totalIncome)}</span>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h3>Deductions</h3>
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span>Type</span>
              <span>Description</span>
              <span>Amount</span>
            </div>
            {filingData.deductions.map((deduction, index) => (
              <div key={index} className={styles.tableRow}>
                <span>{deduction.type}</span>
                <span>{deduction.description}</span>
                <span>{formatCurrency(deduction.amount)}</span>
              </div>
            ))}
            <div className={styles.tableFooter}>
              <span>Total Deductions</span>
              <span>{formatCurrency(totalDeductions)}</span>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h3>Credits</h3>
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span>Type</span>
              <span>Description</span>
              <span>Amount</span>
            </div>
            {filingData.credits.map((credit, index) => (
              <div key={index} className={styles.tableRow}>
                <span>{credit.type}</span>
                <span>{credit.description}</span>
                <span>{formatCurrency(credit.amount)}</span>
              </div>
            ))}
            <div className={styles.tableFooter}>
              <span>Total Credits</span>
              <span>{formatCurrency(totalCredits)}</span>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h3>Tax Calculation</h3>
          <div className={styles.calculation}>
            <div className={styles.calcRow}>
              <span>Total Income</span>
              <span>{formatCurrency(totalIncome)}</span>
            </div>
            <div className={styles.calcRow}>
              <span>Total Deductions</span>
              <span>- {formatCurrency(totalDeductions)}</span>
            </div>
            <div className={styles.calcRow}>
              <span>Taxable Income</span>
              <span>{formatCurrency(taxableIncome)}</span>
            </div>
            <div className={styles.calcRow}>
              <span>Estimated Tax (22% bracket)</span>
              <span>{formatCurrency(estimatedTax)}</span>
            </div>
            <div className={styles.calcRow}>
              <span>Total Credits</span>
              <span>- {formatCurrency(totalCredits)}</span>
            </div>
            <div className={styles.calcRow}>
              <span>Total Payments</span>
              <span>- {formatCurrency(totalPayments)}</span>
            </div>
            <div className={`${styles.calcRow} ${styles.final}`}>
              <span>{estimatedRefund >= 0 ? 'Refund Amount' : 'Amount Due'}</span>
              <span>{formatCurrency(Math.abs(estimatedRefund))}</span>
            </div>
          </div>
        </section>
      </div>

      <div className={styles.actions}>
        <label className={styles.checkbox}>
          <input 
            type="checkbox" 
            onChange={(e) => {
              const submitButton = document.getElementById('submit-button') as HTMLButtonElement;
              if (submitButton) {
                submitButton.disabled = !e.target.checked;
              }
            }}
          />
          <span>I declare under penalties of perjury that this return is true, correct, and complete.</span>
        </label>

        <button
          id="submit-button"
          className={styles.submitButton}
          onClick={onSubmit}
          disabled={true}
        >
          Submit Tax Return
        </button>

        <p className={styles.disclaimer}>
          By submitting this return, you agree that you have reviewed all information and it is accurate to the best of your knowledge.
        </p>
      </div>
    </div>
  );
};
