import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import styles from './UploadZone.module.css';
import { mockTaxProcessingService } from '../../../services/mockTaxProcessingService';
import type { UploadedDocument } from '../../../types/documents';

interface UploadZoneProps {
  onUploadComplete: (documents: UploadedDocument[]) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onUploadComplete }) => {
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      setIsUploading(true);
      const uploadedDocs = await mockTaxProcessingService.uploadDocuments(acceptedFiles);
      onUploadComplete(uploadedDocs);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxSize: 25 * 1024 * 1024 // 25MB
  });

  return (
    <div className={styles.uploadZone} {...getRootProps()}>
      <input {...getInputProps()} />
      <div className={styles.content}>
        {isUploading ? (
          <div className={styles.uploading}>
            <div className={styles.spinner} />
            <p>Uploading documents...</p>
          </div>
        ) : isDragActive ? (
          <div className={styles.dragActive}>
            <p>Drop your tax documents here...</p>
          </div>
        ) : (
          <div className={styles.instructions}>
            <p className={styles.mainText}>
              Drag and drop your tax documents here, or click to select files
            </p>
            <p className={styles.supportedFormats}>
              Supported formats: W-2, 1099s, receipts (PDF, PNG, JPG)
            </p>
            <p className={styles.maxSize}>Maximum file size: 25MB</p>
          </div>
        )}
      </div>
    </div>
  );
};
