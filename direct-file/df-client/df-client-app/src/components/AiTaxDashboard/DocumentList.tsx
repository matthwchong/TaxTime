import React from 'react';
import { 
  FiClock, 
  FiRefreshCw, 
  FiCheckCircle, 
  FiXCircle, 
  FiFileText 
} from 'react-icons/fi';
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
        return <FiClock className={styles.statusIcon} />;
      case 'processing':
        return <FiRefreshCw className={styles.statusIcon} />;
      case 'completed':
        return <FiCheckCircle className={styles.statusIcon} />;
      case 'error':
        return <FiXCircle className={styles.statusIcon} />;
      default:
        return <FiFileText className={styles.statusIcon} />;
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
              {getStatusIcon(doc.status)}
              <span className={styles.name}>{doc.name}</span>
              <span className={styles.status}>{doc.status}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
