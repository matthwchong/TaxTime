/**
 * Tax Return Service
 * Manages tax return data in localStorage for the demo
 */

import type { TaxReturn } from '../types/taxReturn';
import type { TaxFilingData } from '../types/filing';
import { calculateTaxes } from './directFileTaxCalculations';

const STORAGE_KEY = 'taxtime_returns';

/**
 * Generate a unique ID for a tax return
 */
function generateReturnId(): string {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6);
  return `${year}-${timestamp}`;
}

/**
 * Get all tax returns from localStorage
 */
export function getTaxReturns(): TaxReturn[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : getDefaultReturns();
  } catch (error) {
    console.error('Error loading tax returns:', error);
    return getDefaultReturns();
  }
}

/**
 * Save tax returns to localStorage
 */
export function saveTaxReturns(returns: TaxReturn[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(returns));
  } catch (error) {
    console.error('Error saving tax returns:', error);
  }
}

/**
 * Create a new tax return from filing data
 */
export function createTaxReturn(filingData: TaxFilingData): TaxReturn {
  // Calculate accurate tax information
  const filingStatusMap = {
    'SINGLE': 'single' as const,
    'MARRIED_FILING_JOINTLY': 'marriedFilingJointly' as const,
    'MARRIED_FILING_SEPARATELY': 'marriedFilingSeparately' as const,
    'HEAD_OF_HOUSEHOLD': 'headOfHousehold' as const,
    'QUALIFYING_SURVIVING_SPOUSE': 'qualifiedSurvivingSpouse' as const
  };
  
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
  
  const federalTaxWithheld = filingData.payments
    .filter(payment => payment.type === 'FEDERAL_TAX_WITHHELD')
    .reduce((sum, payment) => sum + payment.amount, 0);
  
  const taxCalculation = calculateTaxes({
    w2Wages,
    nonemployeeCompensation,
    interestIncome,
    dividendIncome,
    federalTaxWithheld,
    filingStatus: filingStatusMap[filingData.filingStatus],
    useStandardDeduction: true
  });

  const now = new Date();
  const returnId = generateReturnId();

  return {
    id: returnId,
    taxYear: filingData.taxYear || new Date().getFullYear(),
    status: 'SUBMITTED',
    createdDate: now.toISOString().split('T')[0],
    lastModified: now.toISOString().split('T')[0],
    submittedDate: now.toISOString().split('T')[0],
    filingStatus: filingData.filingStatus,
    estimatedRefund: taxCalculation.estimatedRefund > 0 ? taxCalculation.estimatedRefund : 0,
    estimatedTaxDue: taxCalculation.estimatedTaxDue > 0 ? taxCalculation.estimatedTaxDue : 0,
    totalIncome: taxCalculation.totalIncome,
    adjustedGrossIncome: taxCalculation.adjustedGrossIncome,
    taxableIncome: taxCalculation.taxableIncome,
    federalTax: taxCalculation.tentativeTax,
    totalWithholdings: taxCalculation.totalTaxWithheld,
    progress: 100,
    personalInfo: {
      firstName: filingData.personalInfo.firstName || 'John',
      lastName: filingData.personalInfo.lastName || 'Doe',
      ssn: filingData.personalInfo.ssn || '123-45-6789',
      address: filingData.personalInfo.address || { street: '123 Main St', city: 'Pittsburgh', state: 'PA', zipCode: '15213' },
      email: filingData.personalInfo.email || 'john.doe@example.com',
      phone: filingData.personalInfo.phone || '555-123-4567'
    },
    incomeSources: filingData.incomeSources.map(source => ({
      type: source.type,
      description: source.description,
      amount: source.amount,
      employer: source.employer || 'Unknown'
    })),
    timeline: [
      {
        date: now.toISOString().split('T')[0],
        status: 'SUBMITTED',
        description: 'Tax return submitted to IRS via DirectFile'
      },
      {
        date: now.toISOString().split('T')[0],
        status: 'PROCESSING',
        description: 'Return is being processed by the IRS'
      }
    ]
  };
}

/**
 * Submit a tax return (add it to the list)
 */
export function submitTaxReturn(filingData: TaxFilingData): TaxReturn {
  console.log('submitTaxReturn called with:', filingData);
  
  try {
    const newReturn = createTaxReturn(filingData);
    console.log('Created new return:', newReturn);
    
    const existingReturns = getTaxReturns();
    console.log('Existing returns:', existingReturns);
    
    const updatedReturns = [newReturn, ...existingReturns];
    saveTaxReturns(updatedReturns);
    console.log('Saved updated returns');
    
    return newReturn;
  } catch (error) {
    console.error('Error in submitTaxReturn:', error);
    throw error;
  }
}

/**
 * Save a tax return as draft
 */
export function saveTaxReturnAsDraft(filingData: TaxFilingData): TaxReturn {
  console.log('saveTaxReturnAsDraft called with:', filingData);
  
  try {
    // Calculate accurate tax information
    const filingStatusMap = {
      'SINGLE': 'single' as const,
      'MARRIED_FILING_JOINTLY': 'marriedFilingJointly' as const,
      'MARRIED_FILING_SEPARATELY': 'marriedFilingSeparately' as const,
      'HEAD_OF_HOUSEHOLD': 'headOfHousehold' as const,
      'QUALIFYING_SURVIVING_SPOUSE': 'qualifiedSurvivingSpouse' as const
    };
    
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
    
    const federalTaxWithheld = filingData.payments
      .filter(payment => payment.type === 'FEDERAL_TAX_WITHHELD')
      .reduce((sum, payment) => sum + payment.amount, 0);
    
    const taxCalculation = calculateTaxes({
      w2Wages,
      nonemployeeCompensation,
      interestIncome,
      dividendIncome,
      federalTaxWithheld,
      filingStatus: filingStatusMap[filingData.filingStatus],
      useStandardDeduction: true
    });

    const now = new Date();
    const returnId = generateReturnId();

    // Calculate progress based on completed steps
    let progress = 0;
    if (filingData.personalInfo.firstName && filingData.personalInfo.lastName) progress += 20;
    if (filingData.filingStatus) progress += 20;
    if (filingData.incomeSources.length > 0) progress += 20;
    if (filingData.deductions.length > 0) progress += 10;
    if (filingData.credits.length > 0) progress += 10;
    if (filingData.payments.length > 0) progress += 20;

    const draftReturn: TaxReturn = {
      id: returnId,
      taxYear: filingData.taxYear || new Date().getFullYear(),
      status: 'DRAFT',
      createdDate: now.toISOString().split('T')[0],
      lastModified: now.toISOString().split('T')[0],
      filingStatus: filingData.filingStatus,
      estimatedRefund: taxCalculation.estimatedRefund > 0 ? taxCalculation.estimatedRefund : 0,
      estimatedTaxDue: taxCalculation.estimatedTaxDue > 0 ? taxCalculation.estimatedTaxDue : 0,
      totalIncome: taxCalculation.totalIncome,
      adjustedGrossIncome: taxCalculation.adjustedGrossIncome,
      taxableIncome: taxCalculation.taxableIncome,
      federalTax: taxCalculation.tentativeTax,
      totalWithholdings: taxCalculation.totalTaxWithheld,
      progress: progress,
      personalInfo: {
        firstName: filingData.personalInfo.firstName || 'John',
        lastName: filingData.personalInfo.lastName || 'Doe',
        ssn: filingData.personalInfo.ssn || '123-45-6789',
        address: filingData.personalInfo.address || { street: '123 Main St', city: 'Pittsburgh', state: 'PA', zipCode: '15213' },
        email: filingData.personalInfo.email || 'john.doe@example.com',
        phone: filingData.personalInfo.phone || '555-123-4567'
      },
      incomeSources: filingData.incomeSources.map(source => ({
        type: source.type,
        description: source.description,
        amount: source.amount,
        employer: source.employer || 'Unknown'
      })),
      // Save the complete filing data for restoration
      draftFilingData: filingData
    };

    const existingReturns = getTaxReturns();
    const updatedReturns = [draftReturn, ...existingReturns];
    saveTaxReturns(updatedReturns);
    console.log('Saved draft return:', draftReturn);
    
    return draftReturn;
  } catch (error) {
    console.error('Error in saveTaxReturnAsDraft:', error);
    throw error;
  }
}

/**
 * Update return status (simulate IRS processing)
 */
export function updateReturnStatus(returnId: string, status: TaxReturn['status']): void {
  const returns = getTaxReturns();
  const returnIndex = returns.findIndex(r => r.id === returnId);
  
  if (returnIndex !== -1) {
    returns[returnIndex].status = status;
    returns[returnIndex].lastModified = new Date().toISOString().split('T')[0];
    
    // Add timeline entry
    const statusDescriptions = {
      'DRAFT': 'Return saved as draft',
      'SUBMITTED': 'Return submitted to IRS',
      'PROCESSING': 'Return is being processed',
      'ACCEPTED': 'Return accepted by IRS',
      'REJECTED': 'Return rejected - corrections needed',
      'REFUND_ISSUED': 'Refund has been issued'
    };
    
    if (!returns[returnIndex].timeline) {
      returns[returnIndex].timeline = [];
    }
    
    returns[returnIndex].timeline!.push({
      date: new Date().toISOString().split('T')[0],
      status,
      description: statusDescriptions[status] || `Status updated to ${status}`
    });
    
    saveTaxReturns(returns);
  }
}

/**
 * Delete a tax return
 */
export function deleteTaxReturn(returnId: string): boolean {
  try {
    const returns = getTaxReturns();
    const filteredReturns = returns.filter(r => r.id !== returnId);
    
    if (filteredReturns.length < returns.length) {
      saveTaxReturns(filteredReturns);
      console.log(`Tax return ${returnId} deleted successfully`);
      return true;
    }
    
    console.warn(`Tax return ${returnId} not found`);
    return false;
  } catch (error) {
    console.error('Error deleting tax return:', error);
    return false;
  }
}

/**
 * Clear all tax returns (useful for demo reset)
 */
export function clearAllTaxReturns(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('All tax returns cleared successfully');
  } catch (error) {
    console.error('Error clearing tax returns:', error);
  }
}

/**
 * Reset to default returns (useful for demo setup)
 */
export function resetToDefaultReturns(): void {
  try {
    const defaultReturns = getDefaultReturns();
    saveTaxReturns(defaultReturns);
    console.log('Reset to default tax returns');
  } catch (error) {
    console.error('Error resetting tax returns:', error);
  }
}

/**
 * Get default returns for demo purposes
 */
function getDefaultReturns(): TaxReturn[] {
  return [
    {
      id: '2024-001',
      taxYear: 2024,
      status: 'DRAFT',
      createdDate: '2024-12-01',
      lastModified: '2024-12-01',
      filingStatus: 'SINGLE',
      estimatedRefund: 2500,
      totalIncome: 45629.35,
      totalWithholdings: 9792.56,
      progress: 85
    },
    {
      id: '2023-001',
      taxYear: 2023,
      status: 'ACCEPTED',
      createdDate: '2024-03-15',
      lastModified: '2024-04-15',
      submittedDate: '2024-04-15',
      filingStatus: 'SINGLE',
      estimatedRefund: 1850,
      totalIncome: 42000,
      totalWithholdings: 8400,
      progress: 100,
      timeline: [
        {
          date: '2024-04-15',
          status: 'SUBMITTED',
          description: 'Tax return submitted to IRS'
        },
        {
          date: '2024-04-20',
          status: 'ACCEPTED',
          description: 'Return accepted by IRS'
        },
        {
          date: '2024-05-01',
          status: 'REFUND_ISSUED',
          description: 'Refund of $1,850 issued'
        }
      ]
    }
  ];
}
