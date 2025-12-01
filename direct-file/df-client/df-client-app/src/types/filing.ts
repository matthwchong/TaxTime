export type FilingStatus = 
  | 'SINGLE'
  | 'MARRIED_FILING_JOINTLY'
  | 'MARRIED_FILING_SEPARATELY'
  | 'HEAD_OF_HOUSEHOLD'
  | 'QUALIFYING_WIDOW';

export type FilingStep = 
  | 'PERSONAL_INFO'
  | 'FILING_STATUS'
  | 'INCOME'
  | 'DEDUCTIONS'
  | 'CREDITS'
  | 'PAYMENTS'
  | 'REVIEW';

export interface PersonalInfo {
  firstName: string;
  middleInitial?: string;
  lastName: string;
  ssn: string;
  occupation: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  email: string;
  phone: string;
  dateOfBirth?: string;
  isUsCitizen: boolean;
  canBeClaimed: boolean;
}

export interface IncomeSource {
  type: 'W2_WAGES' | '1099_INT' | '1099_DIV' | '1099_NEC' | 'OTHER';
  amount: number;
  description: string;
  payer: string;
  documentId?: string;
}

export interface Deduction {
  type: 
    | 'STANDARD'
    | 'ITEMIZED'
    | 'STUDENT_LOAN_INTEREST'
    | 'EDUCATOR_EXPENSES'
    | 'IRA_DEDUCTION'
    | 'SELF_EMPLOYED_HEALTH_INSURANCE'
    | 'OTHER';
  amount: number;
  description?: string;
  documentId?: string;
}

export interface Credit {
  type: 
    | 'CHILD_TAX_CREDIT'
    | 'EARNED_INCOME_CREDIT'
    | 'EDUCATION_CREDIT'
    | 'RETIREMENT_SAVINGS_CREDIT'
    | 'OTHER';
  amount: number;
  description?: string;
  documentId?: string;
}

export interface Payment {
  type: 
    | 'FEDERAL_TAX_WITHHELD'
    | 'STATE_TAX_WITHHELD'
    | 'LOCAL_TAX_WITHHELD'
    | 'ESTIMATED_TAX_PAYMENTS'
    | 'OTHER';
  amount: number;
  description?: string;
  documentId?: string;
}

export interface TaxFilingData {
  taxYear: number;
  personalInfo: PersonalInfo;
  filingStatus: FilingStatus;
  incomeSources: IncomeSource[];
  deductions: Deduction[];
  credits: Credit[];
  payments: Payment[];
  currentStep: FilingStep;
  isComplete: boolean;
}

// Maps our data to DirectFile's fact graph format
export function mapToFactGraph(data: TaxFilingData): Record<string, any> {
  const facts: Record<string, any> = {
    // Core tax year
    '/taxYear': {
      '$type': 'gov.irs.factgraph.persisters.IntWrapper',
      'item': data.taxYear
    },

    // Primary filer information
    '/filers': {
      '$type': 'gov.irs.factgraph.persisters.CollectionWrapper',
      'item': { 'items': ['primary-filer-id'] }
    },
    '/filers/#primary-filer-id/firstName': {
      '$type': 'gov.irs.factgraph.persisters.StringWrapper',
      'item': data.personalInfo.firstName
    },
    '/filers/#primary-filer-id/lastName': {
      '$type': 'gov.irs.factgraph.persisters.StringWrapper',
      'item': data.personalInfo.lastName
    },
    '/filers/#primary-filer-id/middleInitial': {
      '$type': 'gov.irs.factgraph.persisters.StringWrapper',
      'item': data.personalInfo.middleInitial || ''
    },
    '/filers/#primary-filer-id/tin': {
      '$type': 'gov.irs.factgraph.persisters.TinWrapper',
      'item': {
        'area': data.personalInfo.ssn.substring(0, 3),
        'group': data.personalInfo.ssn.substring(3, 5),
        'serial': data.personalInfo.ssn.substring(5, 9)
      }
    },
    '/filers/#primary-filer-id/occupation': {
      '$type': 'gov.irs.factgraph.persisters.StringWrapper',
      'item': data.personalInfo.occupation
    },
    '/filers/#primary-filer-id/canBeClaimed': {
      '$type': 'gov.irs.factgraph.persisters.BooleanWrapper',
      'item': false
    },
    '/filers/#primary-filer-id/isUsCitizenFullYear': {
      '$type': 'gov.irs.factgraph.persisters.BooleanWrapper',
      'item': true
    },

    // Address information
    '/address': {
      '$type': 'gov.irs.factgraph.persisters.AddressWrapper',
      'item': {
        'streetAddress': data.personalInfo.address.street,
        'city': data.personalInfo.address.city,
        'stateOrProvence': data.personalInfo.address.state,
        'postalCode': data.personalInfo.address.zipCode,
        'country': 'USA'
      }
    },

    // Contact information
    '/email': {
      '$type': 'gov.irs.factgraph.persisters.EmailAddressWrapper',
      'item': { 'email': data.personalInfo.email }
    },

    // Filing status
    '/filingStatus': {
      '$type': 'gov.irs.factgraph.persisters.StringWrapper',
      'item': data.filingStatus
    },

    // Family and household
    '/familyAndHousehold': {
      '$type': 'gov.irs.factgraph.persisters.CollectionWrapper',
      'item': { 'items': [] }
    },
    '/familyAndHouseholdIsDone': {
      '$type': 'gov.irs.factgraph.persisters.BooleanWrapper',
      'item': true
    },

    // Required boolean flags
    '/disposedDigitalAssets': {
      '$type': 'gov.irs.factgraph.persisters.BooleanWrapper',
      'item': false
    },
    '/filedLastYear': {
      '$type': 'gov.irs.factgraph.persisters.BooleanWrapper',
      'item': false
    },
    '/wantsCommsFormat': {
      '$type': 'gov.irs.factgraph.persisters.BooleanWrapper',
      'item': true
    },

    // Refund preferences
    '/refundViaAch': {
      '$type': 'gov.irs.factgraph.persisters.BooleanWrapper',
      'item': false
    }
  };

  // Add W-2 forms
  const w2Sources = data.incomeSources.filter(source => source.type === 'W2');
  if (w2Sources.length > 0) {
    facts['/formW2s'] = {
      '$type': 'gov.irs.factgraph.persisters.CollectionWrapper',
      'item': {
        'items': w2Sources.map((_, index) => `w2-${index}`)
      }
    };

    w2Sources.forEach((source, index) => {
      const w2Id = `w2-${index}`;
      facts[`/formW2s/#${w2Id}/employerName`] = {
        '$type': 'gov.irs.factgraph.persisters.StringWrapper',
        'item': source.source
      };
      facts[`/formW2s/#${w2Id}/wages`] = {
        '$type': 'gov.irs.factgraph.persisters.DollarWrapper',
        'item': source.amount.toString()
      };
      facts[`/formW2s/#${w2Id}/federalTaxWithheld`] = {
        '$type': 'gov.irs.factgraph.persisters.DollarWrapper',
        'item': (source.amount * 0.2).toString() // Estimate 20% withholding
      };
      facts[`/formW2s/#${w2Id}/hasRRTACodes`] = {
        '$type': 'gov.irs.factgraph.persisters.BooleanWrapper',
        'item': false
      };
      facts[`/formW2s/#${w2Id}/addressMatchesReturn`] = {
        '$type': 'gov.irs.factgraph.persisters.BooleanWrapper',
        'item': true
      };
    });
  }

  // Add 1099-INT forms
  const intSources = data.incomeSources.filter(source => source.type === '1099_INT');
  if (intSources.length > 0) {
    facts['/interestReports'] = {
      '$type': 'gov.irs.factgraph.persisters.CollectionWrapper',
      'item': {
        'items': intSources.map((_, index) => `int-${index}`)
      }
    };

    intSources.forEach((source, index) => {
      const intId = `int-${index}`;
      facts[`/interestReports/#${intId}/payerName`] = {
        '$type': 'gov.irs.factgraph.persisters.StringWrapper',
        'item': source.source
      };
      facts[`/interestReports/#${intId}/interestIncome`] = {
        '$type': 'gov.irs.factgraph.persisters.DollarWrapper',
        'item': source.amount.toString()
      };
    });
  }

  // Add deductions
  if (data.deductions.length > 0) {
    const standardDeduction = data.deductions.find(d => d.type === 'STANDARD');
    if (standardDeduction) {
      facts['/deductionType'] = {
        '$type': 'gov.irs.factgraph.persisters.StringWrapper',
        'item': 'STANDARD'
      };
      facts['/standardDeduction'] = {
        '$type': 'gov.irs.factgraph.persisters.DollarWrapper',
        'item': standardDeduction.amount.toString()
      };
    }
  }

  // Add credits
  data.credits.forEach((credit, index) => {
    if (credit.type === 'CHILD_TAX_CREDIT') {
      facts['/childTaxCredit'] = {
        '$type': 'gov.irs.factgraph.persisters.DollarWrapper',
        'item': credit.amount.toString()
      };
    }
  });

  return facts;
}
