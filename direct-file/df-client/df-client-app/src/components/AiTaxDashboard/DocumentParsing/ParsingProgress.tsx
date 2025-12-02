import React from 'react';
import { 
  FiFileText, 
  FiClock, 
  FiCheckCircle, 
  FiXCircle, 
  FiHelpCircle,
  FiRefreshCw,
  FiPlay
} from 'react-icons/fi';
import type { UploadedDocument } from '../../../types/documents';
import styles from './ParsingProgress.module.css';

interface ParsingProgressProps {
  documents: UploadedDocument[];
  onRetryParsing?: (documentId: string) => void;
}

export const ParsingProgress: React.FC<ParsingProgressProps> = ({ 
  documents, 
  onRetryParsing 
}) => {
  const getStatusIcon = (status: UploadedDocument['status']) => {
    switch (status) {
      case 'UPLOADED':
        return <FiFileText className={styles.statusIconSvg} />;
      case 'PROCESSING':
        return <FiClock className={styles.statusIconSvg} />;
      case 'PARSED':
        return <FiCheckCircle className={styles.statusIconSvg} />;
      case 'ERROR':
        return <FiXCircle className={styles.statusIconSvg} />;
      default:
        return <FiHelpCircle className={styles.statusIconSvg} />;
    }
  };

  const getStatusLabel = (status: UploadedDocument['status']) => {
    switch (status) {
      case 'UPLOADED':
        return 'Ready to process';
      case 'PROCESSING':
        return 'Analyzing document...';
      case 'PARSED':
        return 'Successfully parsed';
      case 'ERROR':
        return 'Processing failed';
      default:
        return 'Unknown status';
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'W2':
        return 'W-2 Form';
      case '1099_INT':
        return '1099-INT Form';
      case '1099_DIV':
        return '1099-DIV Form';
      case '1099_NEC':
        return '1099-NEC Form';
      case '1098_E':
        return '1098-E Form';
      case 'UNKNOWN':
        return 'Unknown Document';
      default:
        return type;
    }
  };

  if (documents.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No documents uploaded yet</p>
        <p className={styles.hint}>Upload tax documents to see parsing progress</p>
      </div>
    );
  }

  return (
    <div className={styles.progressContainer}>
      <h3>Document Processing Status</h3>
      <div className={styles.documentList}>
        {documents.map(doc => (
          <div key={doc.id} className={`${styles.documentItem} ${styles[doc.status.toLowerCase()]}`}>
            <div className={styles.documentHeader}>
              <span className={styles.statusIcon}>{getStatusIcon(doc.status)}</span>
              <div className={styles.documentInfo}>
                <span className={styles.filename}>{doc.filename}</span>
                <span className={styles.documentType}>{getDocumentTypeLabel(doc.type)}</span>
              </div>
              {doc.status === 'UPLOADED' && onRetryParsing && (
                <button 
                  className={styles.processButton}
                  onClick={() => onRetryParsing(doc.id)}
                  title="Process document"
                >
                  <FiPlay className={styles.buttonIcon} />
                  Process
                </button>
              )}
              {doc.status === 'ERROR' && onRetryParsing && (
                <button 
                  className={styles.retryButton}
                  onClick={() => onRetryParsing(doc.id)}
                  title="Retry parsing"
                >
                  <FiRefreshCw className={styles.buttonIcon} />
                  Retry
                </button>
              )}
            </div>
            
            <div className={styles.statusInfo}>
              <span className={styles.statusLabel}>{getStatusLabel(doc.status)}</span>
              {doc.status === 'PROCESSING' && (
                <div className={styles.progressBar}>
                  <div className={styles.progressFill}></div>
                </div>
              )}
            </div>

            <div className={styles.documentMeta}>
              <span className={styles.fileSize}>
                {(doc.sizeBytes / 1024 / 1024).toFixed(2)} MB
              </span>
              <span className={styles.pageCount}>
                {doc.pageCount} page{doc.pageCount !== 1 ? 's' : ''}
              </span>
              <span className={styles.uploadTime}>
                Uploaded {new Date(doc.createdAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Total Documents:</span>
          <span className={styles.summaryValue}>{documents.length}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Successfully Parsed:</span>
          <span className={styles.summaryValue}>
            {documents.filter(d => d.status === 'PARSED').length}
          </span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Processing:</span>
          <span className={styles.summaryValue}>
            {documents.filter(d => d.status === 'PROCESSING').length}
          </span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Errors:</span>
          <span className={styles.summaryValue}>
            {documents.filter(d => d.status === 'ERROR').length}
          </span>
        </div>
      </div>
    </div>
  );
};
