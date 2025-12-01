import React from 'react';
import styles from './DocumentList.module.css';
import type { UploadedDocument } from '../../../types/documents';

interface DocumentListProps {
  documents: UploadedDocument[];
  onProcessDocument?: (documentId: string) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({ 
  documents,
  onProcessDocument 
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'PARSED': return styles.statusSuccess;
      case 'PROCESSING': return styles.statusProcessing;
      case 'ERROR': return styles.statusError;
      default: return styles.statusPending;
    }
  };

  const getDocumentTypeIcon = (type: string): string => {
    switch (type) {
      case 'W2': return '📄 W-2';
      case '1099_INT': return '📄 1099-INT';
      case '1099_DIV': return '📄 1099-DIV';
      case '1099_NEC': return '📄 1099-NEC';
      case '1098_E': return '📄 1098-E';
      default: return '📄 Document';
    }
  };

  return (
    <div className={styles.documentList}>
      <h2>Uploaded Documents</h2>
      {documents.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No documents uploaded yet</p>
        </div>
      ) : (
        <div className={styles.list}>
          {documents.map((doc) => (
            <div key={doc.id} className={styles.documentItem}>
              <div className={styles.documentIcon}>
                {getDocumentTypeIcon(doc.type)}
              </div>
              <div className={styles.documentInfo}>
                <div className={styles.documentName}>{doc.filename}</div>
                <div className={styles.documentMeta}>
                  {formatFileSize(doc.sizeBytes)} • {doc.pageCount} page(s)
                </div>
              </div>
              <div className={styles.documentStatus}>
                <span className={`${styles.status} ${getStatusColor(doc.status)}`}>
                  {doc.status}
                </span>
                {doc.status === 'UPLOADED' && onProcessDocument && (
                  <button
                    className={styles.processButton}
                    onClick={() => onProcessDocument(doc.id)}
                  >
                    Process Document
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
