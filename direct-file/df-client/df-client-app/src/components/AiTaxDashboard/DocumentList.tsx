import React from 'react';
import styles from './DocumentList.module.css';

interface Document {
  id: string;
  name: string;
  status: string;
}

interface DocumentListProps {
  documents: Document[];
}

export const DocumentList: React.FC<DocumentListProps> = ({ documents }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
        return '⏳';
      case 'processing':
        return '🔄';
      case 'completed':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '📄';
    }
  };

  return (
    <div className={styles.documentList}>
      <h2>Uploaded Documents</h2>
      {documents.length === 0 ? (
        <p className={styles.emptyState}>No documents uploaded yet</p>
      ) : (
        <ul>
          {documents.map((doc) => (
            <li key={doc.id} className={styles.documentItem}>
              <span className={styles.icon}>{getStatusIcon(doc.status)}</span>
              <span className={styles.name}>{doc.name}</span>
              <span className={styles.status}>{doc.status}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
