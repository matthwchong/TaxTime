import React, { useMemo, useState } from 'react';
import styles from './FinalReview.module.css';
import type { TaxFilingData, FilingStatus } from '../../../types/filing';
import { calculateTaxes, formatCurrency as formatCurrencyDF, getEffectiveTaxRate, getMarginalTaxRate } from '../../../services/directFileTaxCalculations';

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
  // Calculate accurate taxes using DirectFile's logic
  const taxCalculation = useMemo(() => {
    // Map filing status to DirectFile format
    const filingStatusMap: Record<FilingStatus, 'single' | 'marriedFilingJointly' | 'marriedFilingSeparately' | 'headOfHousehold' | 'qualifiedSurvivingSpouse'> = {
      'SINGLE': 'single',
      'MARRIED_FILING_JOINTLY': 'marriedFilingJointly',
      'MARRIED_FILING_SEPARATELY': 'marriedFilingSeparately',
      'HEAD_OF_HOUSEHOLD': 'headOfHousehold',
      'QUALIFYING_SURVIVING_SPOUSE': 'qualifiedSurvivingSpouse'
    };
    
    // Extract income by type
    const w2Wages = filingData.incomeSources
      .filter(source => source.type === 'W2_WAGES')
      .reduce((sum, source) => sum + source.amount, 0);
    
    const nonemployeeCompensation = filingData.incomeSources
      .filter(source => source.type === '1099_NEC')
      .reduce((sum, source) => sum + source.amount, 0);
    
    const interestIncome = filingData.incomeSources
      .filter(source => source.type === '1099_INT')
      .reduce((sum, source) => sum + source.amount, 0);
    
    const dividendIncome = filingData.incomeSources
      .filter(source => source.type === '1099_DIV')
      .reduce((sum, source) => sum + source.amount, 0);
    
    // Extract federal tax withheld
    const federalTaxWithheld = filingData.payments
      .filter(payment => payment.type === 'FEDERAL_TAX_WITHHELD')
      .reduce((sum, payment) => sum + payment.amount, 0);
    
    return calculateTaxes({
      w2Wages,
      nonemployeeCompensation,
      interestIncome,
      dividendIncome,
      federalTaxWithheld,
      filingStatus: filingStatusMap[filingData.filingStatus],
      useStandardDeduction: true // For now, always use standard deduction
    });
  }, [filingData]);
  
  // Legacy totals for display compatibility
  const totalIncome = taxCalculation.totalIncome;
  const totalDeductions = filingData.deductions.reduce((sum, deduction) => sum + deduction.amount, 0);
  const totalCredits = filingData.credits.reduce((sum, credit) => sum + credit.amount, 0);
  const totalPayments = taxCalculation.totalTaxWithheld;
  const taxableIncome = taxCalculation.taxableIncome;
  const estimatedTax = taxCalculation.tentativeTax;
  const estimatedRefund = taxCalculation.estimatedRefund - taxCalculation.estimatedTaxDue;

  // Filing status map for marginal tax rate calculation
  const filingStatusMap: Record<FilingStatus, 'single' | 'marriedFilingJointly' | 'marriedFilingSeparately' | 'headOfHousehold' | 'qualifiedSurvivingSpouse'> = {
    'SINGLE': 'single',
    'MARRIED_FILING_JOINTLY': 'marriedFilingJointly',
    'MARRIED_FILING_SEPARATELY': 'marriedFilingSeparately',
    'HEAD_OF_HOUSEHOLD': 'headOfHousehold',
    'QUALIFYING_SURVIVING_SPOUSE': 'qualifiedSurvivingSpouse'
  };

  const [acceptDeclaration, setAcceptDeclaration] = useState(false);

  return (
    <div className={styles.finalReview}>
      <div className={styles.header}>
        <h2>Final Review</h2>
        <p>Please review your information carefully before submitting</p>
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <span className={styles.label}>
            {taxCalculation.estimatedRefund > 0 ? 'Estimated Refund' : 'Amount Due'}
          </span>
          <span className={`${styles.amount} ${taxCalculation.estimatedRefund > 0 ? styles.positive : styles.negative}`}>
            {taxCalculation.estimatedRefund > 0 
              ? formatCurrencyDF(taxCalculation.estimatedRefund)
              : formatCurrencyDF(taxCalculation.estimatedTaxDue)
            }
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
          <h3>Tax Calculation (DirectFile Accurate)</h3>
          <div className={styles.calculation}>
            <div className={styles.calcRow}>
              <span>Total Income</span>
              <span>{formatCurrencyDF(taxCalculation.totalIncome)}</span>
            </div>
            <div className={styles.calcRow}>
              <span>Adjusted Gross Income (AGI)</span>
              <span>{formatCurrencyDF(taxCalculation.adjustedGrossIncome)}</span>
            </div>
            <div className={styles.calcRow}>
              <span>Standard Deduction</span>
              <span>- {formatCurrencyDF(taxCalculation.standardDeduction)}</span>
            </div>
            <div className={styles.calcRow}>
              <span>Taxable Income</span>
              <span>{formatCurrencyDF(taxCalculation.taxableIncome)}</span>
            </div>
            <div className={styles.calcRow}>
              <span>Federal Income Tax</span>
              <span>{formatCurrencyDF(taxCalculation.tentativeTax)}</span>
            </div>
            <div className={styles.calcRow}>
              <span>Federal Tax Withheld</span>
              <span>- {formatCurrencyDF(taxCalculation.totalTaxWithheld)}</span>
            </div>
            <div className={styles.calcRow}>
              <span>Effective Tax Rate</span>
              <span>{getEffectiveTaxRate(taxCalculation.tentativeTax, taxCalculation.adjustedGrossIncome).toFixed(2)}%</span>
            </div>
            <div className={styles.calcRow}>
              <span>Marginal Tax Rate</span>
              <span>{getMarginalTaxRate(taxCalculation.taxableIncome, filingStatusMap[filingData.filingStatus])}%</span>
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
            checked={acceptDeclaration}
            onChange={(e) => setAcceptDeclaration(e.target.checked)}
          />
          <span>I declare under penalties of perjury that this return is true, correct, and complete.</span>
        </label>

        <button
          className={styles.submitButton}
          onClick={(e) => {
            console.log('Submit button clicked in FinalReview');
            console.log('acceptDeclaration:', acceptDeclaration);
            console.log('onSubmit function:', onSubmit);
            if (onSubmit) {
              onSubmit();
            } else {
              console.error('onSubmit is not defined!');
            }
          }}
          disabled={!acceptDeclaration}
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
