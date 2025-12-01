import React from 'react';
import styles from './ProcessingStatus.module.css';

interface ProcessingStatusProps {
  status: 'idle' | 'processing' | 'completed' | 'error';
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ status }) => {
  const getStatusMessage = () => {
    switch (status) {
      case 'idle':
        return 'Upload your tax documents to begin';
      case 'processing':
        return 'Processing your documents with AI...';
      case 'completed':
        return 'Document processing completed!';
      case 'error':
        return 'Error processing documents. Please try again.';
      default:
        return '';
    }
  };

  return (
    <div className={`${styles.status} ${styles[status]}`}>
      <div className={styles.statusIcon}>
        {status === 'processing' && <div className={styles.spinner} />}
        {status === 'completed' && '✓'}
        {status === 'error' && '⚠'}
      </div>
      <p>{getStatusMessage()}</p>
    </div>
  );
};
