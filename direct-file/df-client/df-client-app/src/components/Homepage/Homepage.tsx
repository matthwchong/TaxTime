import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TaxReturnSidebar } from './TaxReturnSidebar/TaxReturnSidebar';
import { DashboardOverview } from './DashboardOverview/DashboardOverview';
import { TaxReturnDetails } from './TaxReturnDetails/TaxReturnDetails';
import { getTaxReturns, updateReturnStatus, deleteTaxReturn, saveTaxReturns, clearAllTaxReturns, resetToDefaultReturns } from '../../services/taxReturnService';
import type { TaxReturn } from '../../types/taxReturn';
import styles from './Homepage.module.css';

export const Homepage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedReturn, setSelectedReturn] = useState<TaxReturn | null>(null);
  const [view, setView] = useState<'overview' | 'details'>('overview');

  // Load tax returns from service
  const [taxReturns, setTaxReturns] = useState<TaxReturn[]>([]);

  useEffect(() => {
    const loadTaxReturns = () => {
      const returns = getTaxReturns();
      setTaxReturns(returns);
      
      // If there's a newly submitted return (status SUBMITTED), select it automatically
      const newlySubmitted = returns.find(r => r.status === 'SUBMITTED');
      if (newlySubmitted && !selectedReturn) {
        setSelectedReturn(newlySubmitted);
        setView('details');
        
        // Simulate IRS processing after a short delay
        setTimeout(() => {
          updateReturnStatus(newlySubmitted.id, 'PROCESSING');
          setTaxReturns(getTaxReturns()); // Refresh the list
        }, 2000);
        
        // Simulate acceptance after another delay
        setTimeout(() => {
          updateReturnStatus(newlySubmitted.id, 'ACCEPTED');
          setTaxReturns(getTaxReturns()); // Refresh the list
        }, 5000);
      }
    };

    loadTaxReturns();
    
    // Set up interval to refresh returns (in case of updates)
    const interval = setInterval(loadTaxReturns, 1000);
    
    return () => clearInterval(interval);
  }, [selectedReturn]);

  const handleStartNewFiling = () => {
    navigate('/ai-tax-filing');
  };

  const handleSelectReturn = (taxReturn: TaxReturn) => {
    setSelectedReturn(taxReturn);
    setView('details');
  };

  const handleBackToOverview = () => {
    setSelectedReturn(null);
    setView('overview');
  };

  const handleDeleteReturn = (returnId: string) => {
    if (window.confirm('Are you sure you want to delete this tax return? This action cannot be undone.')) {
      const success = deleteTaxReturn(returnId);
      if (success) {
        // Refresh the returns list
        setTaxReturns(getTaxReturns());
        
        // If the deleted return was selected, go back to overview
        if (selectedReturn && selectedReturn.id === returnId) {
          handleBackToOverview();
        }
        
        alert('Tax return deleted successfully.');
      } else {
        alert('Failed to delete tax return. Please try again.');
      }
    }
  };

  const handleEditReturn = (taxReturn: TaxReturn) => {
    // Navigate to AI tax filing page with draft data
    navigate('/ai-tax-filing', { 
      state: { 
        draftReturn: taxReturn 
      } 
    });
  };

  const handleDuplicateReturn = (taxReturn: TaxReturn) => {
    // Create a copy of the return with a new ID and DRAFT status
    const duplicatedReturn = {
      ...taxReturn,
      id: `${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
      status: 'DRAFT' as const,
      createdDate: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0],
      submittedDate: undefined,
      timeline: undefined,
      progress: 0
    };
    
    const existingReturns = getTaxReturns();
    const updatedReturns = [duplicatedReturn, ...existingReturns];
    saveTaxReturns(updatedReturns);
    setTaxReturns(updatedReturns);
    
    alert(`Tax return duplicated successfully! New return ID: ${duplicatedReturn.id}`);
  };

  const handleResetDemo = () => {
    if (window.confirm('Reset demo data? This will clear all returns and restore defaults.')) {
      resetToDefaultReturns();
      setTaxReturns(getTaxReturns());
      setSelectedReturn(null);
      setView('overview');
      alert('Demo data reset successfully!');
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all tax returns? This cannot be undone.')) {
      clearAllTaxReturns();
      setTaxReturns([]);
      setSelectedReturn(null);
      setView('overview');
      alert('All tax returns cleared!');
    }
  };


  return (
    <div className={styles.homepage}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <h1>TaxTime</h1>
            <p>Manage your tax returns and filings</p>
          </div>
          <div className={styles.profileSection}>
            <div className={styles.demoControls}>
              <button 
                className={styles.demoButton}
                onClick={handleResetDemo}
                title="Reset to default demo data"
              >
                Reset Demo
              </button>
              <button 
                className={styles.demoButton}
                onClick={handleClearAll}
                title="Clear all tax returns"
              >
                Clear All
              </button>
            </div>
            <div className={styles.profileIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.sidebar}>
          <TaxReturnSidebar
            taxReturns={taxReturns}
            selectedReturn={selectedReturn}
            onSelectReturn={handleSelectReturn}
            onEditReturn={handleEditReturn}
            onDeleteReturn={handleDeleteReturn}
            onDuplicateReturn={handleDuplicateReturn}
            onStartNewFiling={handleStartNewFiling}
          />
        </div>

        <div className={styles.contentArea}>
          {view === 'overview' ? (
            <DashboardOverview
              taxReturns={taxReturns}
              onStartNewFiling={handleStartNewFiling}
              onSelectReturn={handleSelectReturn}
            />
          ) : selectedReturn ? (
            <TaxReturnDetails
              taxReturn={selectedReturn}
              onBack={handleBackToOverview}
              onEdit={() => handleEditReturn(selectedReturn)}
              onDelete={() => handleDeleteReturn(selectedReturn.id)}
              onDuplicate={() => handleDuplicateReturn(selectedReturn)}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};
