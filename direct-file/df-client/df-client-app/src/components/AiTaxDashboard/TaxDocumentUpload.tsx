import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import styles from './TaxDocumentUpload.module.css';

interface TaxDocumentUploadProps {
  onDrop: (acceptedFiles: File[]) => void;
}

export const TaxDocumentUpload: React.FC<TaxDocumentUploadProps> = ({ onDrop }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg']
    }
  });

  return (
    <div className={styles.uploadContainer}>
      <div {...getRootProps()} className={styles.dropzone}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop your tax documents here...</p>
        ) : (
          <div>
            <p>Drag & drop your tax documents here, or click to select files</p>
            <p className={styles.supportedFormats}>
              Supported formats: W-2, 1099s, receipts, and other tax documents (PDF, PNG, JPG)
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
