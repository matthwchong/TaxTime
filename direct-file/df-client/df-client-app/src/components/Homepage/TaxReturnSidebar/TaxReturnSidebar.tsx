import React from 'react';
import { 
  FiPlus, 
  FiEdit, 
  FiEye, 
  FiMoreVertical, 
  FiCopy, 
  FiTrash,
  FiFileText,
  FiSend,
  FiCheckCircle,
  FiXCircle,
  FiClock
} from 'react-icons/fi';
import type { TaxReturn } from '../../../types/taxReturn';
import styles from './TaxReturnSidebar.module.css';

interface TaxReturnSidebarProps {
  taxReturns: TaxReturn[];
  selectedReturn: TaxReturn | null;
  onSelectReturn: (taxReturn: TaxReturn) => void;
  onEditReturn: (taxReturn: TaxReturn) => void;
  onDeleteReturn: (returnId: string) => void;
  onDuplicateReturn: (taxReturn: TaxReturn) => void;
  onStartNewFiling: () => void;
}

export const TaxReturnSidebar: React.FC<TaxReturnSidebarProps> = ({
  taxReturns,
  selectedReturn,
  onSelectReturn,
  onEditReturn,
  onDeleteReturn,
  onDuplicateReturn,
  onStartNewFiling
}) => {
  const getStatusIcon = (status: TaxReturn['status']) => {
    switch (status) {
      case 'DRAFT':
        return <FiEdit className={styles.statusIcon} />;
      case 'SUBMITTED':
        return <FiSend className={styles.statusIcon} />;
      case 'PROCESSING':
        return <FiClock className={styles.statusIcon} />;
      case 'ACCEPTED':
        return <FiCheckCircle className={styles.statusIcon} />;
      case 'REJECTED':
        return <FiXCircle className={styles.statusIcon} />;
      case 'REFUND_ISSUED':
        return <FiCheckCircle className={styles.statusIcon} />;
      default:
        return <FiFileText className={styles.statusIcon} />;
    }
  };

  const getStatusColor = (status: TaxReturn['status']) => {
    switch (status) {
      case 'DRAFT':
        return styles.statusDraft;
      case 'SUBMITTED':
        return styles.statusFiled;
      case 'PROCESSING':
        return styles.statusProcessing;
      case 'ACCEPTED':
        return styles.statusAccepted;
      case 'REJECTED':
        return styles.statusRejected;
      case 'REFUND_ISSUED':
        return styles.statusAccepted;
      default:
        return styles.statusDefault;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <h2>Tax Returns</h2>
        <button 
          className={styles.newFilingButton}
          onClick={onStartNewFiling}
        >
          <FiPlus className={styles.plusIcon} />
          Start New Filing
        </button>
      </div>

      <div className={styles.returnsList}>
        {taxReturns.map((taxReturn) => (
          <div
            key={taxReturn.id}
            className={`${styles.returnItem} ${
              selectedReturn?.id === taxReturn.id ? styles.selected : ''
            }`}
            onClick={() => onSelectReturn(taxReturn)}
          >
            <div className={styles.returnHeader}>
              <div className={styles.returnTitle}>
                {getStatusIcon(taxReturn.status)}
                <span className={styles.taxYear}>
                  {taxReturn.taxYear} Tax Return
                </span>
              </div>
              <div className={styles.returnActions}>
                <button
                  className={styles.actionButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditReturn(taxReturn);
                  }}
                  disabled={taxReturn.status === 'ACCEPTED'}
                  title={taxReturn.status === 'DRAFT' ? 'Edit Return' : 'View Return'}
                >
                  {taxReturn.status === 'DRAFT' ? <FiEdit /> : <FiEye />}
                </button>
                <button
                  className={styles.actionButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    // Show context menu
                    showContextMenu(e, taxReturn);
                  }}
                  title="More options"
                >
                  <FiMoreVertical />
                </button>
              </div>
            </div>

            <div className={styles.returnDetails}>
              <div className={`${styles.status} ${getStatusColor(taxReturn.status)}`}>
                {taxReturn.status.replace('_', ' ')}
              </div>
              <div className={styles.progress}>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill}
                    style={{ width: `${taxReturn.progress}%` }}
                  />
                </div>
                <span className={styles.progressText}>
                  {taxReturn.progress}% complete
                </span>
              </div>
            </div>

            <div className={styles.returnSummary}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Income:</span>
                <span className={styles.summaryValue}>
                  {formatCurrency(taxReturn.totalIncome)}
                </span>
              </div>
              {taxReturn.estimatedRefund && taxReturn.estimatedRefund > 0 && (
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Est. Refund:</span>
                  <span className={`${styles.summaryValue} ${styles.refund}`}>
                    {formatCurrency(taxReturn.estimatedRefund)}
                  </span>
                </div>
              )}
              {taxReturn.estimatedTaxDue && taxReturn.estimatedTaxDue > 0 && (
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Tax Due:</span>
                  <span className={`${styles.summaryValue} ${styles.taxDue}`}>
                    {formatCurrency(taxReturn.estimatedTaxDue)}
                  </span>
                </div>
              )}
            </div>

            <div className={styles.returnMeta}>
              <span className={styles.lastModified}>
                Modified {new Date(taxReturn.lastModified).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {taxReturns.length === 0 && (
        <div className={styles.emptyState}>
          <FiFileText className={styles.emptyIcon} />
          <h3>No Tax Returns Yet</h3>
          <p>Start your first tax filing to see it here</p>
          <button 
            className={styles.emptyStateButton}
            onClick={onStartNewFiling}
          >
            <FiPlus className={styles.buttonIcon} />
            Start New Filing
          </button>
        </div>
      )}
    </div>
  );

  function showContextMenu(e: React.MouseEvent, taxReturn: TaxReturn) {
    // Simple context menu implementation
    const menu = document.createElement('div');
    menu.className = styles.contextMenu;
    menu.innerHTML = `
      <div class="${styles.contextMenuItem}" data-action="duplicate">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        Duplicate Return
      </div>
      ${taxReturn.status === 'DRAFT' ? `
        <div class="${styles.contextMenuItem}" data-action="delete">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3,6 5,6 21,6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          Delete Return
        </div>
      ` : ''}
    `;

    menu.style.position = 'fixed';
    menu.style.left = `${e.clientX}px`;
    menu.style.top = `${e.clientY}px`;
    menu.style.zIndex = '10000';

    document.body.appendChild(menu);

    const handleMenuClick = (event: Event) => {
      const target = event.target as HTMLElement;
      const action = target.dataset.action;
      
      if (action === 'duplicate') {
        onDuplicateReturn(taxReturn);
      } else if (action === 'delete') {
        onDeleteReturn(taxReturn.id);
      }
      
      document.body.removeChild(menu);
      document.removeEventListener('click', handleMenuClick);
    };

    const handleClickOutside = (event: Event) => {
      if (!menu.contains(event.target as Node)) {
        document.body.removeChild(menu);
        document.removeEventListener('click', handleClickOutside);
      }
    };

    menu.addEventListener('click', handleMenuClick);
    setTimeout(() => document.addEventListener('click', handleClickOutside), 0);
  }
};
