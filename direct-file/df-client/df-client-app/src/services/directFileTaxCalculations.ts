/**
 * DirectFile Tax Calculations Service
 * 
 * This service implements the exact tax calculation logic used by DirectFile,
 * based on the XML tax calculation rules in the DirectFile backend.
 * 
 * All calculations are for Tax Year 2024 and follow IRS Publication 15 and
 * Revenue Procedure guidelines as implemented in DirectFile.
 */

export interface TaxCalculationResult {
  totalIncome: number;
  adjustedGrossIncome: number;
  standardDeduction: number;
  taxableIncome: number;
  tentativeTax: number;
  totalTaxWithheld: number;
  estimatedRefund: number;
  estimatedTaxDue: number;
}

export interface TaxCalculationInput {
  // Income sources
  w2Wages: number;
  nonemployeeCompensation: number; // 1099-NEC
  interestIncome: number; // 1099-INT
  dividendIncome: number; // 1099-DIV
  
  // Tax withholdings
  federalTaxWithheld: number;
  
  // Personal information
  filingStatus: 'single' | 'marriedFilingJointly' | 'marriedFilingSeparately' | 'headOfHousehold' | 'qualifiedSurvivingSpouse';
  
  // Deductions (for now, we'll use standard deduction)
  useStandardDeduction: boolean;
}

/**
 * 2024 Tax Year Standard Deductions (from DirectFile standardDeduction.xml)
 */
const STANDARD_DEDUCTIONS_2024 = {
  single: 14600,
  marriedFilingSeparately: 14600,
  marriedFilingJointly: 29200,
  headOfHousehold: 21900,
  qualifiedSurvivingSpouse: 29200
} as const;

/**
 * Calculate total income from all sources
 */
function calculateTotalIncome(input: TaxCalculationInput): number {
  return input.w2Wages + 
         input.nonemployeeCompensation + 
         input.interestIncome + 
         input.dividendIncome;
}

/**
 * Calculate Adjusted Gross Income (AGI)
 * For basic returns, this is total income minus adjustments to income
 * For now, we assume no adjustments (student loan interest, etc.)
 * DirectFile rounds AGI to the nearest dollar
 */
function calculateAGI(totalIncome: number): number {
  // AGI = Total Income - Adjustments to Income
  // For basic returns, adjustments are typically 0
  const adjustmentsToIncome = 0;
  return Math.round(totalIncome - adjustmentsToIncome);
}

/**
 * Get standard deduction based on filing status
 */
function getStandardDeduction(filingStatus: TaxCalculationInput['filingStatus']): number {
  return STANDARD_DEDUCTIONS_2024[filingStatus];
}

/**
 * Calculate taxable income
 * Taxable Income = AGI - Total Deductions (but not less than 0)
 */
function calculateTaxableIncome(agi: number, standardDeduction: number): number {
  return Math.round(Math.max(agi - standardDeduction, 0));
}

/**
 * Round taxable income according to DirectFile tax table rules
 * (from DirectFile taxCalculations.xml /roundedTaxableIncome)
 */
function roundTaxableIncomeForTaxTables(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;
  
  // Special cases for very low income
  if (taxableIncome < 5) return 2.50;
  if (taxableIncome < 15) return 10;
  if (taxableIncome < 25) return 20;
  
  // $25 increments for income between $25 and $3,000
  if (taxableIncome < 3000) {
    return Math.floor(taxableIncome / 25) * 25 + 12.50;
  }
  
  // $50 increments for income between $3,000 and $100,000
  if (taxableIncome < 100000) {
    return Math.floor(taxableIncome / 50) * 50 + 25;
  }
  
  // Income of $100,000+ uses exact amount (tax computation worksheet)
  return taxableIncome;
}

/**
 * Calculate tentative tax from taxable income using 2024 tax brackets
 * (from DirectFile taxCalculations.xml /tentativeTaxFromTaxableIncome)
 */
function calculateTentativeTax(roundedTaxableIncome: number, filingStatus: TaxCalculationInput['filingStatus']): number {
  if (roundedTaxableIncome <= 0) return 0;
  
  let tax = 0;
  
  switch (filingStatus) {
    case 'single':
    case 'marriedFilingSeparately':
      // Single and MFS use the same brackets
      if (roundedTaxableIncome <= 11600) {
        // 10% of taxable income
        tax = roundedTaxableIncome * 0.10;
      } else if (roundedTaxableIncome <= 47150) {
        // $1,160 plus 12% of excess over $11,600
        tax = 1160 + (roundedTaxableIncome - 11600) * 0.12;
      } else if (roundedTaxableIncome <= 100525) {
        // $5,426 plus 22% of excess over $47,150
        tax = 5426 + (roundedTaxableIncome - 47150) * 0.22;
      } else if (roundedTaxableIncome <= 191950) {
        // $17,168.50 plus 24% of excess over $100,525
        tax = 17168.50 + (roundedTaxableIncome - 100525) * 0.24;
      } else if (roundedTaxableIncome <= 243725) {
        // $39,110.50 plus 32% of excess over $191,950
        tax = 39110.50 + (roundedTaxableIncome - 191950) * 0.32;
      } else if (roundedTaxableIncome <= 609350) {
        // $55,678.50 plus 35% of excess over $243,725
        tax = 55678.50 + (roundedTaxableIncome - 243725) * 0.35;
      } else {
        // $183,647.25 plus 37% of excess over $609,350
        tax = 183647.25 + (roundedTaxableIncome - 609350) * 0.37;
      }
      break;
      
    case 'marriedFilingJointly':
    case 'qualifiedSurvivingSpouse':
      // MFJ and QSS use the same brackets (double the single amounts)
      if (roundedTaxableIncome <= 23200) {
        // 10% of taxable income
        tax = roundedTaxableIncome * 0.10;
      } else if (roundedTaxableIncome <= 94300) {
        // $2,320 plus 12% of excess over $23,200
        tax = 2320 + (roundedTaxableIncome - 23200) * 0.12;
      } else if (roundedTaxableIncome <= 201050) {
        // $10,852 plus 22% of excess over $94,300
        tax = 10852 + (roundedTaxableIncome - 94300) * 0.22;
      } else if (roundedTaxableIncome <= 383900) {
        // $34,337 plus 24% of excess over $201,050
        tax = 34337 + (roundedTaxableIncome - 201050) * 0.24;
      } else if (roundedTaxableIncome <= 487450) {
        // $78,221 plus 32% of excess over $383,900
        tax = 78221 + (roundedTaxableIncome - 383900) * 0.32;
      } else if (roundedTaxableIncome <= 731200) {
        // $111,357 plus 35% of excess over $487,450
        tax = 111357 + (roundedTaxableIncome - 487450) * 0.35;
      } else {
        // $196,669.50 plus 37% of excess over $731,200
        tax = 196669.50 + (roundedTaxableIncome - 731200) * 0.37;
      }
      break;
      
    case 'headOfHousehold':
      if (roundedTaxableIncome <= 16550) {
        // 10% of taxable income
        tax = roundedTaxableIncome * 0.10;
      } else if (roundedTaxableIncome <= 63100) {
        // $1,655 plus 12% of excess over $16,550
        tax = 1655 + (roundedTaxableIncome - 16550) * 0.12;
      } else if (roundedTaxableIncome <= 100500) {
        // $7,241 plus 22% of excess over $63,100
        tax = 7241 + (roundedTaxableIncome - 63100) * 0.22;
      } else if (roundedTaxableIncome <= 191950) {
        // $15,469 plus 24% of excess over $100,500
        tax = 15469 + (roundedTaxableIncome - 100500) * 0.24;
      } else if (roundedTaxableIncome <= 243700) {
        // $37,417 plus 32% of excess over $191,950
        tax = 37417 + (roundedTaxableIncome - 191950) * 0.32;
      } else if (roundedTaxableIncome <= 609350) {
        // $53,977 plus 35% of excess over $243,700
        tax = 53977 + (roundedTaxableIncome - 243700) * 0.35;
      } else {
        // $181,954.50 plus 37% of excess over $609,350
        tax = 181954.50 + (roundedTaxableIncome - 609350) * 0.37;
      }
      break;
  }
  
  return Math.round(tax);
}

/**
 * Main tax calculation function that implements DirectFile's exact logic
 */
export function calculateTaxes(input: TaxCalculationInput): TaxCalculationResult {
  // Step 1: Calculate total income
  const totalIncome = calculateTotalIncome(input);
  
  // Step 2: Calculate Adjusted Gross Income (AGI)
  const adjustedGrossIncome = calculateAGI(totalIncome);
  
  // Step 3: Get standard deduction
  const standardDeduction = input.useStandardDeduction 
    ? getStandardDeduction(input.filingStatus)
    : 0; // For now, assume standard deduction
  
  // Step 4: Calculate taxable income
  const taxableIncome = calculateTaxableIncome(adjustedGrossIncome, standardDeduction);
  
  // Step 5: Round taxable income for tax tables
  const roundedTaxableIncome = roundTaxableIncomeForTaxTables(taxableIncome);
  
  // Step 6: Calculate tentative tax
  const tentativeTax = calculateTentativeTax(roundedTaxableIncome, input.filingStatus);
  
  // Step 7: Calculate refund or amount due
  const totalTaxWithheld = input.federalTaxWithheld;
  const estimatedRefund = totalTaxWithheld > tentativeTax ? totalTaxWithheld - tentativeTax : 0;
  const estimatedTaxDue = tentativeTax > totalTaxWithheld ? tentativeTax - totalTaxWithheld : 0;
  
  return {
    totalIncome,
    adjustedGrossIncome,
    standardDeduction,
    taxableIncome,
    tentativeTax,
    totalTaxWithheld,
    estimatedRefund,
    estimatedTaxDue
  };
}

/**
 * Helper function to format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

/**
 * Helper function to get effective tax rate
 */
export function getEffectiveTaxRate(tentativeTax: number, adjustedGrossIncome: number): number {
  if (adjustedGrossIncome === 0) return 0;
  return (tentativeTax / adjustedGrossIncome) * 100;
}

/**
 * Helper function to get marginal tax rate based on taxable income and filing status
 */
export function getMarginalTaxRate(taxableIncome: number, filingStatus: TaxCalculationInput['filingStatus']): number {
  if (taxableIncome <= 0) return 0;
  
  switch (filingStatus) {
    case 'single':
    case 'marriedFilingSeparately':
      if (taxableIncome <= 11600) return 10;
      if (taxableIncome <= 47150) return 12;
      if (taxableIncome <= 100525) return 22;
      if (taxableIncome <= 191950) return 24;
      if (taxableIncome <= 243725) return 32;
      if (taxableIncome <= 609350) return 35;
      return 37;
      
    case 'marriedFilingJointly':
    case 'qualifiedSurvivingSpouse':
      if (taxableIncome <= 23200) return 10;
      if (taxableIncome <= 94300) return 12;
      if (taxableIncome <= 201050) return 22;
      if (taxableIncome <= 383900) return 24;
      if (taxableIncome <= 487450) return 32;
      if (taxableIncome <= 731200) return 35;
      return 37;
      
    case 'headOfHousehold':
      if (taxableIncome <= 16550) return 10;
      if (taxableIncome <= 63100) return 12;
      if (taxableIncome <= 100500) return 22;
      if (taxableIncome <= 191950) return 24;
      if (taxableIncome <= 243700) return 32;
      if (taxableIncome <= 609350) return 35;
      return 37;
      
    default:
      return 0;
  }
}
