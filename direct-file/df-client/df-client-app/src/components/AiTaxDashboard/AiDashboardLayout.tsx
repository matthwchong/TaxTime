import React from 'react';
import styles from './AiDashboardLayout.module.css';

interface AiDashboardLayoutProps {
  children: React.ReactNode;
}

export const AiDashboardLayout: React.FC<AiDashboardLayoutProps> = ({ children }) => {
  return (
    <div className={styles.layout}>
      {children}
    </div>
  );
};
