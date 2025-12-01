import React from 'react';
import styles from './FilingProgress.module.css';
import type { FilingStep, TaxFilingData } from '../../../types/filing';

interface FilingProgressProps {
  currentStep: FilingStep;
  filingData: TaxFilingData;
  onStepSelect: (step: FilingStep) => void;
}

const STEPS: { id: FilingStep; label: string; description: string }[] = [
  {
    id: 'PERSONAL_INFO',
    label: 'Personal Information',
    description: 'Basic details and contact information'
  },
  {
    id: 'FILING_STATUS',
    label: 'Filing Status',
      description: 'How you\'re filing your taxes'
  },
  {
    id: 'INCOME',
    label: 'Income',
    description: 'W-2s, 1099s, and other income sources'
  },
  {
    id: 'DEDUCTIONS',
    label: 'Deductions',
    description: 'Standard or itemized deductions'
  },
  {
    id: 'CREDITS',
    label: 'Credits',
    description: 'Tax credits you may qualify for'
  },
  {
    id: 'PAYMENTS',
    label: 'Payments',
    description: 'Tax payments and withholdings'
  },
  {
    id: 'REVIEW',
    label: 'Review & Submit',
    description: 'Final review before submission'
  }
];

export const FilingProgress: React.FC<FilingProgressProps> = ({
  currentStep,
  filingData,
  onStepSelect
}) => {
  const getStepStatus = (step: FilingStep) => {
    const stepIndex = STEPS.findIndex(s => s.id === step);
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  const isStepComplete = (step: FilingStep): boolean => {
    switch (step) {
      case 'PERSONAL_INFO':
        return Boolean(
          filingData.personalInfo.firstName && 
          filingData.personalInfo.lastName &&
          filingData.personalInfo.ssn &&
          filingData.personalInfo.occupation &&
          filingData.personalInfo.address.street &&
          filingData.personalInfo.address.city &&
          filingData.personalInfo.address.state &&
          filingData.personalInfo.address.zipCode &&
          filingData.personalInfo.email
        );
      case 'FILING_STATUS':
        return Boolean(filingData.filingStatus);
      case 'INCOME':
        return true; // Allow progression even if no income documents
      case 'DEDUCTIONS':
        return true; // Allow progression even if no deductions
      case 'CREDITS':
        return true; // Optional
      case 'PAYMENTS':
        return true; // Allow progression even if no additional payments
      case 'REVIEW':
        return true;
      default:
        return false;
    }
  };

  const isStepAccessible = (step: FilingStep): boolean => {
    const stepOrder: FilingStep[] = [
      'PERSONAL_INFO',
      'FILING_STATUS',
      'INCOME',
      'DEDUCTIONS',
      'CREDITS',
      'PAYMENTS',
      'REVIEW'
    ];
    
    const currentIndex = stepOrder.indexOf(currentStep);
    const targetIndex = stepOrder.indexOf(step);
    
    // Allow moving to any previous step or the next available step
    return targetIndex <= currentIndex + 1 && isStepComplete(stepOrder[targetIndex - 1] || 'PERSONAL_INFO');
  };

  return (
    <div className={styles.progress}>
      <h2>Filing Progress</h2>
      <div className={styles.steps}>
        {STEPS.map((step, index) => {
          const status = getStepStatus(step.id);
          const isComplete = isStepComplete(step.id);

          return (
            <button
              key={step.id}
              className={`${styles.step} ${styles[status]} ${isComplete ? styles.complete : ''}`}
              onClick={() => onStepSelect(step.id)}
              disabled={status === 'pending' && !isComplete}
            >
              <div className={styles.stepNumber}>
                {status === 'completed' ? '✓' : index + 1}
              </div>
              <div className={styles.stepContent}>
                <div className={styles.stepLabel}>{step.label}</div>
                <div className={styles.stepDescription}>{step.description}</div>
              </div>
              {isComplete && status !== 'completed' && (
                <div className={styles.readyBadge}>Ready</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
