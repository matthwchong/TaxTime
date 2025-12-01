import React from 'react';
import styles from './AIInsights.module.css';

interface AIInsightsProps {
  insights: string[];
}

export const AIInsights: React.FC<AIInsightsProps> = ({ insights }) => {
  return (
    <div className={styles.insights}>
      <h2>AI Insights</h2>
      {insights.length === 0 ? (
        <p className={styles.emptyState}>Upload documents to get AI-powered insights</p>
      ) : (
        <ul>
          {insights.map((insight, index) => (
            <li key={index} className={styles.insight}>
              <span className={styles.icon}>💡</span>
              <span className={styles.text}>{insight}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
