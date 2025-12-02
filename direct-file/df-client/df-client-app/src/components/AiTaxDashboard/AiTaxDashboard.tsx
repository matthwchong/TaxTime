import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiUser } from 'react-icons/fi';
import { UploadZone } from './DocumentUpload/UploadZone';
import { DocumentList } from './DocumentList/DocumentList';
import { DocumentReview } from './Review/DocumentReview';
import { DraftReturn } from './Return/DraftReturn';
import { FinalReview } from './Review/FinalReview';
import { FilingProgress } from './FilingProgress/FilingProgress';
import { ParsingProgress } from './DocumentParsing/ParsingProgress';
import { mockTaxProcessingService } from '../../services/mockTaxProcessingService';
import { calculateTaxes, formatCurrency as formatCurrencyDF } from '../../services/directFileTaxCalculations';
import { submitTaxReturn, saveTaxReturnAsDraft } from '../../services/taxReturnService';
import { mapToFactGraph } from '../../types/filing';
import type { 
  UploadedDocument, 
  ExtractedDocument, 
  DraftReturn as DraftReturnType 
} from '../../types/documents';
import type { 
  FilingStep,
  TaxFilingData,
  FilingStatus
} from '../../types/filing';
import { AiDashboardLayout } from './AiDashboardLayout';
import styles from './AiTaxDashboard.module.css';

export const AiTaxDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedDocuments, setExtractedDocuments] = useState<ExtractedDocument[]>([]);
  const [draftReturn, setDraftReturn] = useState<DraftReturnType | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<FilingStep>('PERSONAL_INFO');
  const [selectedDeductionType, setSelectedDeductionType] = useState<'STANDARD' | 'ITEMIZED' | null>(null);
  const [eicEligibilityChecked, setEicEligibilityChecked] = useState(false);
  const [eicEligible, setEicEligible] = useState<boolean | null>(null);
  
  const [filingData, setFilingData] = useState<TaxFilingData>({
    taxYear: new Date().getFullYear(),
    personalInfo: {
      firstName: '',
      lastName: '',
      middleInitial: '',
      ssn: '',
      occupation: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: ''
      },
      email: '',
      phone: '',
      dateOfBirth: '',
      isUsCitizen: true,
      canBeClaimed: false
    },
    filingStatus: 'SINGLE',
    incomeSources: [],
    deductions: [],
    credits: [],
    payments: [],
    currentStep: 'PERSONAL_INFO',
    isComplete: false
  });

  // Calculate accurate taxes using DirectFile logic
  const taxCalculation = useMemo(() => {
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
    
    return calculateTaxes({
      w2Wages,
      nonemployeeCompensation,
      interestIncome,
      dividendIncome,
      federalTaxWithheld,
      filingStatus: filingStatusMap[filingData.filingStatus],
      useStandardDeduction: true
    });
  }, [filingData]);

  const checkEICEligibility = useCallback(() => {
    setEicEligibilityChecked(true);
    
    // Calculate total income from all sources
    const totalIncome = filingData.incomeSources.reduce((sum, source) => {
      return sum + (source.wages || 0) + (source.nonemployeeCompensation || 0);
    }, 0);
    
    // EIC eligibility rules for 2024 (simplified)
    const filingStatus = filingData.filingStatus || 'SINGLE';
    const age = filingData.personalInfo?.dateOfBirth ? 
      new Date().getFullYear() - new Date(filingData.personalInfo.dateOfBirth).getFullYear() : 25;
    
    let maxIncome = 0;
    let estimatedCredit = 0;
    
    // Income limits for 2024 (no qualifying children)
    if (filingStatus === 'MARRIED_FILING_JOINTLY') {
      maxIncome = 22610; // MFJ without children
    } else {
      maxIncome = 16510; // Single/HoH/MFS without children
    }
    
    // Must be between 25-64 years old if no qualifying children
    const ageEligible = age >= 25 && age < 65;
    const incomeEligible = totalIncome > 0 && totalIncome <= maxIncome;
    
    const eligible = ageEligible && incomeEligible;
    setEicEligible(eligible);
    
    if (eligible) {
      // Simplified EIC calculation (actual calculation is more complex)
      if (totalIncome <= 8260) {
        estimatedCredit = Math.round(totalIncome * 0.0765); // 7.65% phase-in rate
      } else if (totalIncome <= maxIncome) {
        const maxCredit = 632; // Max credit for no children in 2024
        const phaseOutRate = 0.0765;
        const phaseOutStart = filingStatus === 'MARRIED_FILING_JOINTLY' ? 14810 : 8260;
        estimatedCredit = Math.max(0, maxCredit - Math.round((totalIncome - phaseOutStart) * phaseOutRate));
      }
      
      // Add the credit to filing data
      setFilingData(prev => ({
        ...prev,
        credits: [
          ...prev.credits.filter(c => c.type !== 'EARNED_INCOME_CREDIT'),
          {
            type: 'EARNED_INCOME_CREDIT',
            amount: estimatedCredit,
            description: 'Earned Income Credit'
          }
        ]
      }));
    }
  }, [filingData]);

  // Load draft data if editing an existing draft
  useEffect(() => {
    const state = location.state as { draftReturn?: any } | null;
    if (state?.draftReturn?.draftFilingData) {
      console.log('Loading draft data:', state.draftReturn.draftFilingData);
      const draftData = state.draftReturn.draftFilingData;
      
      // Restore filing data
      setFilingData(draftData);
      
      // Restore documents if they exist
      if (draftData.documents) {
        setDocuments(draftData.documents);
      }
      
      // Restore extracted documents if they exist
      if (draftData.extractedDocuments) {
        setExtractedDocuments(draftData.extractedDocuments);
      }
      
      // Restore deduction selection state
      if (draftData.deductions && draftData.deductions.length > 0) {
        const hasStandard = draftData.deductions.some(d => d.type === 'STANDARD');
        const hasItemized = draftData.deductions.some(d => d.type === 'ITEMIZED');
        if (hasStandard) setSelectedDeductionType('STANDARD');
        if (hasItemized) setSelectedDeductionType('ITEMIZED');
      }
      
      // Restore EIC eligibility state
      const hasEIC = draftData.credits && draftData.credits.some(c => c.type === 'EARNED_INCOME_CREDIT');
      if (hasEIC) {
        setEicEligibilityChecked(true);
        setEicEligible(true);
      }
      
      // Set the current step
      if (draftData.currentStep) {
        setCurrentStep(draftData.currentStep);
      } else {
        // Determine step based on completed data
        if (!draftData.personalInfo?.firstName) {
          setCurrentStep('PERSONAL_INFO');
        } else if (!draftData.filingStatus || draftData.filingStatus === 'SINGLE') {
          setCurrentStep('FILING_STATUS');
        } else if (draftData.incomeSources?.length === 0) {
          setCurrentStep('INCOME');
        } else {
          setCurrentStep('REVIEW');
        }
      }
    }
  }, [location.state]);

  const handleUploadComplete = useCallback((newDocuments: UploadedDocument[]) => {
    setDocuments(prev => [...prev, ...newDocuments]);
  }, []);

  const handleSaveAsDraft = useCallback(async () => {
    try {
      console.log('Saving as draft...');
      
      // Include current step and documents in the filing data
      const filingDataWithState = {
        ...filingData,
        currentStep,
        documents,
        extractedDocuments
      };
      
      const draftReturn = saveTaxReturnAsDraft(filingDataWithState);
      
      // Show success message
      alert(`Tax return saved as draft! Return ID: ${draftReturn.id}`);
      
      // Navigate back to homepage to view the draft return
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Error saving draft. Please try again.');
    }
  }, [filingData, currentStep, documents, extractedDocuments, navigate]);

  const handleProcessDocument = useCallback(async (documentId: string) => {
    // Set document status to PROCESSING
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId ? { ...doc, status: 'PROCESSING' } : doc
    ));
    
    setIsProcessing(true);
    try {
      const extractedDocs = await mockTaxProcessingService.processDocuments([documentId]);
      setExtractedDocuments(prev => [...prev, ...extractedDocs]);
      
      // Update document status to PARSED
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId ? { ...doc, status: 'PARSED' } : doc
      ));

      // Select the processed document for review
      setSelectedDocument(documentId);

      // Generate draft return if we have processed documents
      const draftReturn = await mockTaxProcessingService.generateDraftReturn();
      setDraftReturn(draftReturn);

      // Auto-populate filing data with extracted information
      const latestExtraction = extractedDocs[0];
      if (latestExtraction) {
        // W-2 fields
        const wagesField = latestExtraction.fields.find(f => f.key === 'wages');
        const employerField = latestExtraction.fields.find(f => f.key === 'employerName');
        const stateTaxField = latestExtraction.fields.find(f => f.key === 'stateTaxWithheld');
        const localTaxField = latestExtraction.fields.find(f => f.key === 'localTaxWithheld');
        
        // 1099-NEC fields
        const necCompensationField = latestExtraction.fields.find(f => f.key === 'nonemployeeCompensation');
        const payerField = latestExtraction.fields.find(f => f.key === 'payerName');
        
        
        // Federal tax withheld (common to both W-2 and 1099-NEC)
        const federalTaxField = latestExtraction.fields.find(f => f.key === 'federalTaxWithheld');

        setFilingData(prev => {
          // Only remove the specific types that we're about to add back
          let filteredSources = prev.incomeSources;
          
          // Remove W2 if we're adding a new W2
          if (wagesField) {
            filteredSources = filteredSources.filter(source => source.type !== 'W2_WAGES');
          }
          
          // Remove 1099-NEC if we're adding a new 1099-NEC
          if (necCompensationField) {
            filteredSources = filteredSources.filter(source => source.type !== '1099_NEC');
          }
          
          return {
            ...prev,
            incomeSources: [
              ...filteredSources,
              // Add W-2 wages if present
              ...(wagesField ? [{
                type: 'W2_WAGES' as const,
                amount: Number(wagesField.value) || 0,
                description: `W-2 Wages from ${employerField?.value || 'University of Pittsburgh'}`,
                payer: employerField?.value?.toString() || 'University of Pittsburgh'
              }] : []),
              // Add 1099-NEC compensation if present
              ...(necCompensationField ? [{
                type: '1099_NEC' as const,
                amount: Number(necCompensationField.value) || 0,
                description: `1099-NEC Nonemployee Compensation from ${payerField?.value || 'Cannon Tools Co'}`,
                payer: payerField?.value?.toString() || 'Cannon Tools Co'
              }] : [])
            ],
          payments: [
            ...prev.payments.filter(payment => !['FEDERAL_TAX_WITHHELD', 'STATE_TAX_WITHHELD', 'LOCAL_TAX_WITHHELD'].includes(payment.type)), // Remove existing taxes
            ...(federalTaxField ? [{
              type: 'FEDERAL_TAX_WITHHELD' as const,
              amount: Number(federalTaxField.value) || 0,
              description: `Federal Tax Withheld from ${employerField?.value || payerField?.value || 'Payer'}`
            }] : []),
            ...(stateTaxField ? [{
              type: 'STATE_TAX_WITHHELD' as const,
              amount: Number(stateTaxField.value) || 0,
              description: `PA State Tax Withheld from ${employerField?.value || 'University of Pittsburgh'}`
            }] : []),
            ...(localTaxField ? [{
              type: 'LOCAL_TAX_WITHHELD' as const,
              amount: Number(localTaxField.value) || 0,
              description: `Pittsburgh Local Tax Withheld from ${employerField?.value || 'University of Pittsburgh'}`
            }] : [])
            ]
          };
        });
        
      }
    } catch (error) {
      console.error('Processing failed:', error);
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId ? { ...doc, status: 'ERROR' } : doc
      ));
    } finally {
      setIsProcessing(false);
    }
  }, []);


  return (
    <AiDashboardLayout>
      <div className={styles.dashboard}>
            <div className={styles.header}>
              <div className={styles.headerContent}>
                <div className={styles.titleSection}>
                  <h1>TaxTime</h1>
                  <p>Upload your tax documents and let AI handle your tax filing</p>
                </div>
                <div className={styles.profileSection}>
                  <button 
                    className={styles.saveAsDraftButton}
                    onClick={handleSaveAsDraft}
                    title="Save your progress as a draft"
                  >
                    Save as Draft
                  </button>
                  <div className={styles.profileIcon}>
                    <FiUser size={32} />
                  </div>
                </div>
              </div>
            </div>
      
      <div className={styles.mainContent}>
        <div className={styles.sidebar}>
          <FilingProgress
            currentStep={currentStep}
            filingData={filingData}
            onStepSelect={setCurrentStep}
          />
        </div>
        
        <div className={styles.contentPanel}>
          {currentStep === 'INCOME' ? (
            <>
              <UploadZone onUploadComplete={handleUploadComplete} />
              <ParsingProgress 
                documents={documents}
                onRetryParsing={handleProcessDocument}
              />
              
              {/* Show extracted document information */}
              {extractedDocuments.length > 0 && (
                <div className={styles.extractedSection}>
                  <h3>Extracted Tax Information</h3>
                  {extractedDocuments.map((doc) => (
                    <div key={doc.documentId} className={styles.extractedDocument}>
                      <DocumentReview
                        document={doc}
                        onFieldUpdate={async (fieldKey, newValue) => {
                          setExtractedDocuments(prev => prev.map(prevDoc => 
                            prevDoc.documentId === doc.documentId
                              ? {
                                  ...prevDoc,
                                  fields: prevDoc.fields.map(field =>
                                    field.key === fieldKey
                                      ? { ...field, value: newValue }
                                      : field
                                  )
                                }
                              : prevDoc
                          ));

                          // Update draft return with new values
                          const updatedDraft = await mockTaxProcessingService.generateDraftReturn();
                          setDraftReturn(updatedDraft);
                        }}
                      />
                    </div>
                  ))}
                  
                  {/* Show summary of extracted data */}
                  {extractedDocuments.length > 0 && (
                    <div className={styles.summarySection}>
                      <h4>Summary of Extracted Information</h4>
                      <div className={styles.summaryGrid}>
                        {extractedDocuments.map(doc => {
                          const totalIncome = doc.fields
                            .filter(f => 
                              f.key.includes('wages') || 
                              f.key.includes('income') || 
                              f.key.includes('nonemployeeCompensation') ||
                              f.key.includes('compensation')
                            )
                            .reduce((sum, f) => sum + (Number(f.value) || 0), 0);
                          const totalWithheld = doc.fields
                            .filter(f => f.key.includes('federalTaxWithheld') || f.key.includes('taxWithheld'))
                            .reduce((sum, f) => sum + (Number(f.value) || 0), 0);
                          
                          return (
                            <div key={doc.documentId} className={styles.summaryCard}>
                              <h5>{doc.type} Document</h5>
                              <p><strong>Total Income:</strong> {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalIncome)}</p>
                              <p><strong>Tax Withheld:</strong> {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalWithheld)}</p>
                              <p className={styles.nextStepHint}>✓ This information has been added to your tax return</p>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Show current income summary */}
                      {filingData.incomeSources.length > 0 && (
                        <div className={styles.incomeTotal}>
                          <h4>Total Income for Tax Return</h4>
                          <div className={styles.incomeSummary}>
                            {filingData.incomeSources.map((source, index) => (
                              <div key={index} className={styles.incomeItem}>
                                <span>{source.description}</span>
                                <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(source.amount)}</span>
                              </div>
                            ))}
                            <div className={styles.incomeTotal}>
                              <strong>
                                <span>Total Income:</span>
                                <span>{formatCurrencyDF(taxCalculation.totalIncome)}</span>
                              </strong>
                            </div>
                            <div className={styles.taxSummary}>
                              <div className={styles.taxItem}>
                                <span>Adjusted Gross Income:</span>
                                <span>{formatCurrencyDF(taxCalculation.adjustedGrossIncome)}</span>
                              </div>
                              <div className={styles.taxItem}>
                                <span>Standard Deduction:</span>
                                <span>{formatCurrencyDF(taxCalculation.standardDeduction)}</span>
                              </div>
                              <div className={styles.taxItem}>
                                <span>Taxable Income:</span>
                                <span>{formatCurrencyDF(taxCalculation.taxableIncome)}</span>
                              </div>
                              <div className={styles.taxItem}>
                                <span>Federal Income Tax:</span>
                                <span>{formatCurrencyDF(taxCalculation.tentativeTax)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : currentStep === 'PERSONAL_INFO' ? (
            <div className={styles.formSection}>
              <h2>Personal Information</h2>
              <div className={styles.formGrid}>
                <input
                  type="text"
                  placeholder="First Name *"
                  value={filingData.personalInfo.firstName}
                  onChange={(e) => setFilingData(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, firstName: e.target.value }
                  }))}
                  className={styles.input}
                  required
                />
                <input
                  type="text"
                  placeholder="Middle Initial"
                  value={filingData.personalInfo.middleInitial}
                  onChange={(e) => setFilingData(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, middleInitial: e.target.value }
                  }))}
                  className={styles.input}
                  maxLength={1}
                />
                <input
                  type="text"
                  placeholder="Last Name *"
                  value={filingData.personalInfo.lastName}
                  onChange={(e) => setFilingData(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, lastName: e.target.value }
                  }))}
                  className={styles.input}
                  required
                />
                <input
                  type="text"
                  placeholder="Social Security Number *"
                  value={filingData.personalInfo.ssn}
                  onChange={(e) => setFilingData(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, ssn: e.target.value }
                  }))}
                  className={styles.input}
                  pattern="[0-9]{9}"
                  maxLength={9}
                  required
                />
                <input
                  type="date"
                  placeholder="Date of Birth"
                  value={filingData.personalInfo.dateOfBirth}
                  onChange={(e) => setFilingData(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, dateOfBirth: e.target.value }
                  }))}
                  className={styles.input}
                />
                <input
                  type="text"
                  placeholder="Occupation *"
                  value={filingData.personalInfo.occupation}
                  onChange={(e) => setFilingData(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, occupation: e.target.value }
                  }))}
                  className={styles.input}
                  required
                />
                <input
                  type="text"
                  placeholder="Street Address *"
                  value={filingData.personalInfo.address.street}
                  onChange={(e) => setFilingData(prev => ({
                    ...prev,
                    personalInfo: { 
                      ...prev.personalInfo, 
                      address: { ...prev.personalInfo.address, street: e.target.value }
                    }
                  }))}
                  className={styles.input}
                  required
                />
                <input
                  type="text"
                  placeholder="City *"
                  value={filingData.personalInfo.address.city}
                  onChange={(e) => setFilingData(prev => ({
                    ...prev,
                    personalInfo: { 
                      ...prev.personalInfo, 
                      address: { ...prev.personalInfo.address, city: e.target.value }
                    }
                  }))}
                  className={styles.input}
                  required
                />
                <input
                  type="text"
                  placeholder="State *"
                  value={filingData.personalInfo.address.state}
                  onChange={(e) => setFilingData(prev => ({
                    ...prev,
                    personalInfo: { 
                      ...prev.personalInfo, 
                      address: { ...prev.personalInfo.address, state: e.target.value }
                    }
                  }))}
                  className={styles.input}
                  maxLength={2}
                  required
                />
                <input
                  type="text"
                  placeholder="ZIP Code *"
                  value={filingData.personalInfo.address.zipCode}
                  onChange={(e) => setFilingData(prev => ({
                    ...prev,
                    personalInfo: { 
                      ...prev.personalInfo, 
                      address: { ...prev.personalInfo.address, zipCode: e.target.value }
                    }
                  }))}
                  className={styles.input}
                  pattern="[0-9]{5}"
                  maxLength={5}
                  required
                />
                <input
                  type="email"
                  placeholder="Email Address *"
                  value={filingData.personalInfo.email}
                  onChange={(e) => setFilingData(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, email: e.target.value }
                  }))}
                  className={styles.input}
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={filingData.personalInfo.phone}
                  onChange={(e) => setFilingData(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, phone: e.target.value }
                  }))}
                  className={styles.input}
                />
                
                <div className={styles.checkboxGroup}>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={filingData.personalInfo.isUsCitizen}
                      onChange={(e) => setFilingData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, isUsCitizen: e.target.checked }
                      }))}
                    />
                    <span>I am a U.S. citizen for the full tax year</span>
                  </label>
                </div>

                <div className={styles.checkboxGroup}>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={filingData.personalInfo.canBeClaimed}
                      onChange={(e) => setFilingData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, canBeClaimed: e.target.checked }
                      }))}
                    />
                    <span>Someone else can claim me as a dependent</span>
                  </label>
                </div>
              </div>
            </div>
          ) : currentStep === 'FILING_STATUS' ? (
            <div className={styles.formSection}>
              <h2>Filing Status</h2>
              <div className={styles.statusOptions}>
                {['SINGLE', 'MARRIED_FILING_JOINTLY', 'MARRIED_FILING_SEPARATELY', 'HEAD_OF_HOUSEHOLD', 'QUALIFYING_WIDOW'].map((status) => (
                  <button
                    key={status}
                    className={`${styles.statusOption} ${filingData.filingStatus === status ? styles.selected : ''}`}
                    onClick={() => setFilingData(prev => ({
                      ...prev,
                      filingStatus: status as FilingStatus
                    }))}
                  >
                    {status.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          ) : currentStep === 'DEDUCTIONS' ? (
            <div className={styles.formSection}>
              <h2>Deductions</h2>
              <div className={styles.deductionOptions}>
                <div className={styles.deductionCard}>
                  <h3>Standard Deduction</h3>
                  <p>For {filingData.taxYear}, the standard deduction is:</p>
                  <div className={styles.deductionAmount}>
                    {filingData.filingStatus === 'MARRIED_FILING_JOINTLY' ? '$27,700' :
                     filingData.filingStatus === 'HEAD_OF_HOUSEHOLD' ? '$20,800' :
                     '$13,850'}
                  </div>
                  <button 
                    className={`${styles.deductionButton} ${selectedDeductionType === 'STANDARD' ? styles.selected : ''}`}
                    onClick={() => {
                      setSelectedDeductionType('STANDARD');
                      setFilingData(prev => ({
                        ...prev,
                        deductions: [{
                          type: 'STANDARD',
                          amount: filingData.filingStatus === 'MARRIED_FILING_JOINTLY' ? 27700 :
                                  filingData.filingStatus === 'HEAD_OF_HOUSEHOLD' ? 20800 : 13850,
                          description: 'Standard Deduction'
                        }]
                      }));
                    }}
                    disabled={selectedDeductionType === 'STANDARD'}
                  >
                    {selectedDeductionType === 'STANDARD' ? '✓ Standard Deduction Selected' : 'Choose Standard Deduction'}
                  </button>
                </div>

                <div className={styles.deductionCard}>
                  <h3>Itemized Deductions</h3>
                  <p>Enter your itemized deductions if they exceed the standard deduction:</p>
                  <button 
                    className={`${styles.deductionButton} ${selectedDeductionType === 'ITEMIZED' ? styles.selected : ''}`}
                    onClick={() => {
                      setSelectedDeductionType('ITEMIZED');
                      setFilingData(prev => ({
                        ...prev,
                        deductions: [] // Clear deductions to start fresh with itemized
                      }));
                    }}
                    disabled={selectedDeductionType === 'ITEMIZED'}
                  >
                    {selectedDeductionType === 'ITEMIZED' ? '✓ Itemized Deductions Selected' : 'Choose Itemized Deductions'}
                  </button>
                  
                  {selectedDeductionType === 'ITEMIZED' && (
                    <div className={styles.itemizedList}>
                    <div className={styles.itemizedItem}>
                      <label>Mortgage Interest</label>
                      <input 
                        type="number" 
                        className={styles.input}
                        placeholder="Enter amount"
                        onChange={(e) => {
                          const amount = parseFloat(e.target.value) || 0;
                          setFilingData(prev => ({
                            ...prev,
                            deductions: [
                              ...prev.deductions.filter(d => d.type !== 'ITEMIZED'),
                              {
                                type: 'ITEMIZED',
                                amount,
                                description: 'Mortgage Interest'
                              }
                            ]
                          }));
                        }}
                      />
                    </div>
                    <div className={styles.itemizedItem}>
                      <label>Charitable Contributions</label>
                      <input 
                        type="number" 
                        className={styles.input}
                        placeholder="Enter amount"
                        onChange={(e) => {
                          const amount = parseFloat(e.target.value) || 0;
                          setFilingData(prev => ({
                            ...prev,
                            deductions: [
                              ...prev.deductions.filter(d => d.type !== 'ITEMIZED'),
                              {
                                type: 'ITEMIZED',
                                amount,
                                description: 'Charitable Contributions'
                              }
                            ]
                          }));
                        }}
                      />
                    </div>
                    <div className={styles.itemizedItem}>
                      <label>State and Local Taxes</label>
                      <input 
                        type="number" 
                        className={styles.input}
                        placeholder="Enter amount"
                        onChange={(e) => {
                          const amount = parseFloat(e.target.value) || 0;
                          setFilingData(prev => ({
                            ...prev,
                            deductions: [
                              ...prev.deductions.filter(d => d.type !== 'ITEMIZED'),
                              {
                                type: 'ITEMIZED',
                                amount,
                                description: 'State and Local Taxes'
                              }
                            ]
                          }));
                        }}
                      />
                    </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : currentStep === 'CREDITS' ? (
            <div className={styles.formSection}>
              <h2>Tax Credits</h2>
              <div className={styles.creditOptions}>
                <div className={styles.creditCard}>
                  <h3>Child Tax Credit</h3>
                  <p>Up to $2,000 per qualifying child</p>
                  <div className={styles.creditInput}>
                    <label>Number of Qualifying Children</label>
                    <input 
                      type="number" 
                      min="0"
                      className={styles.input}
                      onChange={(e) => {
                        const count = parseInt(e.target.value) || 0;
                        setFilingData(prev => ({
                          ...prev,
                          credits: [
                            ...prev.credits.filter(c => c.type !== 'CHILD_TAX_CREDIT'),
                            {
                              type: 'CHILD_TAX_CREDIT',
                              amount: count * 2000,
                              description: `Child Tax Credit for ${count} children`
                            }
                          ]
                        }));
                      }}
                    />
                  </div>
                </div>

                <div className={styles.creditCard}>
                  <h3>Earned Income Credit (EIC)</h3>
                  <p>For taxpayers with low to moderate income. Must be 25-64 years old if no qualifying children.</p>
                  
                  {!eicEligibilityChecked ? (
                    <button 
                      className={styles.creditButton}
                      onClick={checkEICEligibility}
                    >
                      Check Eligibility
                    </button>
                  ) : (
                    <div>
                      <button 
                        className={`${styles.creditButton} ${eicEligible ? styles.selected : styles.ineligible}`}
                        disabled
                      >
                        {eicEligible ? '✓ Eligible for EIC' : '✗ Not Eligible for EIC'}
                      </button>
                      
                      {eicEligible && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#28a745' }}>
                          Estimated Credit: ${filingData.credits.find(c => c.type === 'EARNED_INCOME_CREDIT')?.amount || 0}
                        </div>
                      )}
                      
                      {!eicEligible && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#dc3545' }}>
                          {filingData.personalInfo?.dateOfBirth && 
                           (new Date().getFullYear() - new Date(filingData.personalInfo.dateOfBirth).getFullYear() < 25 ||
                            new Date().getFullYear() - new Date(filingData.personalInfo.dateOfBirth).getFullYear() >= 65) 
                           ? 'Age requirement not met (must be 25-64)' 
                           : 'Income too high for eligibility'}
                        </div>
                      )}
                      
                      <button 
                        className={styles.creditButton}
                        onClick={() => {
                          setEicEligibilityChecked(false);
                          setEicEligible(null);
                          setFilingData(prev => ({
                            ...prev,
                            credits: prev.credits.filter(c => c.type !== 'EARNED_INCOME_CREDIT')
                          }));
                        }}
                        style={{ marginTop: '0.5rem', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                      >
                        Check Again
                      </button>
                    </div>
                  )}
                </div>

                <div className={styles.creditCard}>
                  <h3>Education Credits</h3>
                  <p>American Opportunity and Lifetime Learning Credits</p>
                  <div className={styles.creditInput}>
                    <label>Education Expenses</label>
                    <input 
                      type="number" 
                      className={styles.input}
                      placeholder="Enter amount"
                      onChange={(e) => {
                        const amount = parseFloat(e.target.value) || 0;
                        setFilingData(prev => ({
                          ...prev,
                          credits: [
                            ...prev.credits.filter(c => c.type !== 'EDUCATION_CREDIT'),
                            {
                              type: 'EDUCATION_CREDIT',
                              amount: Math.min(amount * 0.25, 2500), // 25% of expenses up to $2,500
                              description: 'Education Credit'
                            }
                          ]
                        }));
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : currentStep === 'PAYMENTS' ? (
            <div className={styles.formSection}>
              <h2>Tax Payments</h2>
              <div className={styles.paymentOptions}>
                <div className={styles.paymentCard}>
                  <h3>Federal Tax Withheld</h3>
                  <p>Total from W-2s and 1099s (automatically calculated from uploaded documents)</p>
                  <div className={styles.paymentAmount}>
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
                      .format(filingData.payments
                        .filter(p => p.type === 'FEDERAL_TAX_WITHHELD')
                        .reduce((sum, p) => sum + p.amount, 0)
                      )}
                  </div>
                  {filingData.payments.filter(p => ['FEDERAL_TAX_WITHHELD', 'STATE_TAX_WITHHELD', 'LOCAL_TAX_WITHHELD'].includes(p.type)).length > 0 && (
                    <div className={styles.paymentBreakdown}>
                      <h4>Tax Withholdings Breakdown:</h4>
                      {filingData.payments
                        .filter(p => ['FEDERAL_TAX_WITHHELD', 'STATE_TAX_WITHHELD', 'LOCAL_TAX_WITHHELD'].includes(p.type))
                        .map((payment, index) => (
                          <div key={index} className={styles.paymentItem}>
                            <span>{payment.description}</span>
                            <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(payment.amount)}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <div className={styles.paymentCard}>
                  <h3>Estimated Tax Payments</h3>
                  <div className={styles.paymentInput}>
                    <label>Additional Payments Made</label>
                    <input 
                      type="number" 
                      className={styles.input}
                      placeholder="Enter amount"
                      value={filingData.payments
                        .find(p => p.type === 'ESTIMATED_TAX_PAYMENTS')?.amount || ''}
                      onChange={(e) => {
                        const amount = parseFloat(e.target.value) || 0;
                        setFilingData(prev => ({
                          ...prev,
                          payments: [
                            ...prev.payments.filter(p => p.type !== 'ESTIMATED_TAX_PAYMENTS'),
                            ...(amount > 0 ? [{
                              type: 'ESTIMATED_TAX_PAYMENTS' as const,
                              amount,
                              description: 'Estimated Tax Payments'
                            }] : [])
                          ]
                        }));
                      }}
                    />
                  </div>
                </div>

                <div className={styles.paymentCard}>
                  <h3>Total Payments</h3>
                  <p>All tax payments and withholdings</p>
                  <div className={styles.paymentAmount}>
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
                      .format(filingData.payments.reduce((sum, p) => sum + p.amount, 0))}
                  </div>
                </div>
              </div>
            </div>
          ) : currentStep === 'REVIEW' ? (
            <div className={styles.formSection}>
              <FinalReview
                filingData={filingData}
                onSubmit={async () => {
                  console.log('Submit button clicked!');
                  try {
                    console.log('Filing data:', filingData);
                    
                    // Convert filing data to DirectFile's fact graph format
                    const facts = mapToFactGraph(filingData);
                    console.log('Converted to facts:', facts);
                    
                    // Submit the return and create a record
                    console.log('Submitting return to IRS...');
                    const submittedReturn = submitTaxReturn(filingData);
                    console.log('Submitted return:', submittedReturn);
                    
                    // Show success message
                    alert(`Tax return submitted successfully! Return ID: ${submittedReturn.id}`);
                    
                    // Navigate back to homepage to view the submitted return
                    console.log('Navigating to dashboard...');
                    navigate('/dashboard');
                  } catch (error) {
                    console.error('Error submitting return:', error);
                    alert(`Error submitting tax return: ${error.message}. Please try again.`);
                  }
                }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
    </AiDashboardLayout>
  );
};
