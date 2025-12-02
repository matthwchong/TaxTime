import React from 'react';
import { 
  FiArrowLeft,
  FiEdit, 
  FiCopy, 
  FiTrash,
  FiFileText,
  FiSend,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiDownload
} from 'react-icons/fi';
import type { TaxReturn } from '../../../types/taxReturn';
import styles from './TaxReturnDetails.module.css';

interface TaxReturnDetailsProps {
  taxReturn: TaxReturn;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export const TaxReturnDetails: React.FC<TaxReturnDetailsProps> = ({
  taxReturn,
  onBack,
  onEdit,
  onDelete,
  onDuplicate
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status: TaxReturn['status']) => {
    switch (status) {
      case 'DRAFT':
        return <FiEdit className={styles.titleStatusIcon} />;
      case 'SUBMITTED':
        return <FiSend className={styles.titleStatusIcon} />;
      case 'PROCESSING':
        return <FiClock className={styles.titleStatusIcon} />;
      case 'ACCEPTED':
        return <FiCheckCircle className={styles.titleStatusIcon} />;
      case 'REJECTED':
        return <FiXCircle className={styles.titleStatusIcon} />;
      case 'REFUND_ISSUED':
        return <FiCheckCircle className={styles.titleStatusIcon} />;
      default:
        return <FiFileText className={styles.titleStatusIcon} />;
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

  const getTimelineIcon = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <FiEdit className={styles.timelineIcon} />;
      case 'SUBMITTED':
        return <FiSend className={styles.timelineIcon} />;
      case 'PROCESSING':
        return <FiClock className={styles.timelineIcon} />;
      case 'ACCEPTED':
        return <FiCheckCircle className={styles.timelineIcon} />;
      case 'REJECTED':
        return <FiXCircle className={styles.timelineIcon} />;
      case 'REFUND_ISSUED':
        return <FiCheckCircle className={styles.timelineIcon} />;
      default:
        return <FiFileText className={styles.timelineIcon} />;
    }
  };

  return (
    <div className={styles.details}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={onBack}>
          <FiArrowLeft className={styles.backIcon} />
          Back to Overview
        </button>
        <div className={styles.actions}>
          {taxReturn.status === 'DRAFT' && (
            <button className={styles.editButton} onClick={onEdit}>
              <FiEdit className={styles.buttonIcon} />
              Edit Return
            </button>
          )}
          <button className={styles.duplicateButton} onClick={onDuplicate}>
            <FiCopy className={styles.buttonIcon} />
            Duplicate
          </button>
          <button className={styles.deleteButton} onClick={onDelete}>
            <FiTrash className={styles.buttonIcon} />
            Delete
          </button>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.titleSection}>
          <div className={styles.titleHeader}>
            {getStatusIcon(taxReturn.status)}
            <h1>{taxReturn.taxYear} Tax Return</h1>
            <span className={`${styles.status} ${getStatusColor(taxReturn.status)}`}>
              {taxReturn.status.replace('_', ' ')}
            </span>
          </div>
          
          {taxReturn.status === 'DRAFT' && (
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
          )}
        </div>

        <div className={styles.infoGrid}>
          {/* Basic Information */}
          <div className={styles.infoCard}>
            <h3>Basic Information</h3>
            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Tax Year:</span>
                <span className={styles.infoValue}>{taxReturn.taxYear}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Filing Status:</span>
                <span className={styles.infoValue}>
                  {taxReturn.filingStatus.replace('_', ' ')}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Created:</span>
                <span className={styles.infoValue}>
                  {formatDate(taxReturn.createdDate)}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Last Modified:</span>
                <span className={styles.infoValue}>
                  {formatDate(taxReturn.lastModified)}
                </span>
              </div>
              {taxReturn.filedDate && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Filed Date:</span>
                  <span className={styles.infoValue}>
                    {formatDate(taxReturn.filedDate)}
                  </span>
                </div>
              )}
              {taxReturn.acceptedDate && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Accepted Date:</span>
                  <span className={styles.infoValue}>
                    {formatDate(taxReturn.acceptedDate)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Financial Summary */}
          <div className={styles.infoCard}>
            <h3>Financial Summary</h3>
            <div className={styles.financialGrid}>
              <div className={styles.financialItem}>
                <div className={styles.financialLabel}>Total Income</div>
                <div className={styles.financialValue}>
                  {formatCurrency(taxReturn.totalIncome)}
                </div>
              </div>
              <div className={styles.financialItem}>
                <div className={styles.financialLabel}>Total Withholdings</div>
                <div className={styles.financialValue}>
                  {formatCurrency(taxReturn.totalWithholdings)}
                </div>
              </div>
              {taxReturn.estimatedRefund && taxReturn.estimatedRefund > 0 && (
                <div className={styles.financialItem}>
                  <div className={styles.financialLabel}>Estimated Refund</div>
                  <div className={`${styles.financialValue} ${styles.refund}`}>
                    {formatCurrency(taxReturn.estimatedRefund)}
                  </div>
                </div>
              )}
              {taxReturn.estimatedTaxDue && taxReturn.estimatedTaxDue > 0 && (
                <div className={styles.financialItem}>
                  <div className={styles.financialLabel}>Estimated Tax Due</div>
                  <div className={`${styles.financialValue} ${styles.taxDue}`}>
                    {formatCurrency(taxReturn.estimatedTaxDue)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status Timeline */}
          <div className={styles.infoCard}>
            <h3>Status Timeline</h3>
            <div className={styles.timeline}>
              {taxReturn.timeline ? (
                // Use the new timeline data if available
                taxReturn.timeline.map((item, index) => (
                  <div key={index} className={styles.timelineItem}>
                    {getTimelineIcon(item.status)}
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineTitle}>{item.description}</div>
                      <div className={styles.timelineDate}>
                        {formatDate(item.date)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                // Fallback to old timeline format
                <>
                  <div className={styles.timelineItem}>
                    <FiEdit className={styles.timelineIcon} />
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineTitle}>Return Created</div>
                      <div className={styles.timelineDate}>
                        {formatDate(taxReturn.createdDate)}
                      </div>
                    </div>
                  </div>
                  
                  {taxReturn.submittedDate && (
                    <div className={styles.timelineItem}>
                      <FiSend className={styles.timelineIcon} />
                      <div className={styles.timelineContent}>
                        <div className={styles.timelineTitle}>Return Submitted</div>
                        <div className={styles.timelineDate}>
                          {formatDate(taxReturn.submittedDate)}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className={styles.infoCard}>
            <h3>Available Actions</h3>
            <div className={styles.actionsList}>
              {taxReturn.status === 'DRAFT' && (
                <button className={styles.actionButton} onClick={onEdit}>
                  <FiEdit className={styles.actionIcon} />
                  <div className={styles.actionContent}>
                    <div className={styles.actionTitle}>Continue Editing</div>
                    <div className={styles.actionDescription}>
                      Resume working on this tax return
                    </div>
                  </div>
                </button>
              )}
              
              <button className={styles.actionButton} onClick={onDuplicate}>
                <FiCopy className={styles.actionIcon} />
                <div className={styles.actionContent}>
                  <div className={styles.actionTitle}>Duplicate Return</div>
                  <div className={styles.actionDescription}>
                    Create a copy of this return
                  </div>
                </div>
              </button>
              
              <button className={styles.actionButton}>
                <FiDownload className={styles.actionIcon} />
                <div className={styles.actionContent}>
                  <div className={styles.actionTitle}>Download PDF</div>
                  <div className={styles.actionDescription}>
                    Download a copy of this return
                  </div>
                </div>
              </button>
              
              <button 
                className={`${styles.actionButton} ${styles.deleteAction}`} 
                onClick={onDelete}
              >
                <FiTrash className={styles.actionIcon} />
                <div className={styles.actionContent}>
                  <div className={styles.actionTitle}>Delete Return</div>
                  <div className={styles.actionDescription}>
                    Permanently delete this return
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
