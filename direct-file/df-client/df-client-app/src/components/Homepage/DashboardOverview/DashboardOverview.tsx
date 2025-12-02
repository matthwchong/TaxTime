import React from 'react';
import { 
  FiBarChart2, 
  FiEdit, 
  FiCheckCircle, 
  FiDollarSign,
  FiPlus,
  FiUpload,
  FiPieChart,
  FiFileText
} from 'react-icons/fi';
import type { TaxReturn } from '../../../types/taxReturn';
import styles from './DashboardOverview.module.css';

interface DashboardOverviewProps {
  taxReturns: TaxReturn[];
  onStartNewFiling: () => void;
  onSelectReturn: (taxReturn: TaxReturn) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  taxReturns,
  onStartNewFiling,
  onSelectReturn
}) => {
  const currentYear = new Date().getFullYear();
  const currentYearReturn = taxReturns.find(tr => tr.taxYear === currentYear);
  
  const stats = {
    totalReturns: taxReturns.length,
    draftReturns: taxReturns.filter(tr => tr.status === 'DRAFT').length,
    filedReturns: taxReturns.filter(tr => tr.status === 'FILED' || tr.status === 'ACCEPTED').length,
    totalRefunds: taxReturns
      .filter(tr => tr.estimatedRefund && tr.estimatedRefund > 0)
      .reduce((sum, tr) => sum + (tr.estimatedRefund || 0), 0)
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status: TaxReturn['status']) => {
    switch (status) {
      case 'DRAFT':
        return styles.statusDraft;
      case 'FILED':
        return styles.statusFiled;
      case 'ACCEPTED':
        return styles.statusAccepted;
      case 'REJECTED':
        return styles.statusRejected;
      case 'PROCESSING':
        return styles.statusProcessing;
      default:
        return styles.statusDefault;
    }
  };

  return (
    <div className={styles.overview}>
      <div className={styles.welcomeSection}>
        <h2>Welcome back!</h2>
        <p>Here's an overview of your tax filing activity</p>
      </div>

      {/* Current Year Status */}
      <div className={styles.currentYearSection}>
        <h3>{currentYear} Tax Year</h3>
        {currentYearReturn ? (
          <div 
            className={styles.currentYearCard}
            onClick={() => onSelectReturn(currentYearReturn)}
          >
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <span className={styles.yearBadge}>{currentYear}</span>
                <span className={`${styles.status} ${getStatusColor(currentYearReturn.status)}`}>
                  {currentYearReturn.status.replace('_', ' ')}
                </span>
              </div>
              <div className={styles.progress}>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill}
                    style={{ width: `${currentYearReturn.progress}%` }}
                  />
                </div>
                <span className={styles.progressText}>
                  {currentYearReturn.progress}% complete
                </span>
              </div>
            </div>
            
            <div className={styles.cardContent}>
              <div className={styles.financialSummary}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Total Income</span>
                  <span className={styles.summaryValue}>
                    {formatCurrency(currentYearReturn.totalIncome)}
                  </span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Withholdings</span>
                  <span className={styles.summaryValue}>
                    {formatCurrency(currentYearReturn.totalWithholdings)}
                  </span>
                </div>
                {currentYearReturn.estimatedRefund && currentYearReturn.estimatedRefund > 0 && (
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Est. Refund</span>
                    <span className={`${styles.summaryValue} ${styles.refund}`}>
                      {formatCurrency(currentYearReturn.estimatedRefund)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.noCurrentYear}>
            <FiFileText className={styles.noCurrentYearIcon} />
            <h4>No {currentYear} tax return started</h4>
            <p>Start your {currentYear} tax filing to track your progress here</p>
            <button 
              className={styles.startFilingButton}
              onClick={onStartNewFiling}
            >
              <FiPlus className={styles.buttonIcon} />
              Start {currentYear} Filing
            </button>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className={styles.statsSection}>
        <h3>Filing Statistics</h3>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <FiBarChart2 className={styles.statIcon} />
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.totalReturns}</div>
              <div className={styles.statLabel}>Total Returns</div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <FiEdit className={styles.statIcon} />
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.draftReturns}</div>
              <div className={styles.statLabel}>Draft Returns</div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <FiCheckCircle className={styles.statIcon} />
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.filedReturns}</div>
              <div className={styles.statLabel}>Filed Returns</div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <FiDollarSign className={styles.statIcon} />
            <div className={styles.statContent}>
              <div className={styles.statValue}>{formatCurrency(stats.totalRefunds)}</div>
              <div className={styles.statLabel}>Total Refunds</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Returns */}
      {taxReturns.length > 0 && (
        <div className={styles.recentSection}>
          <h3>Recent Tax Returns</h3>
          <div className={styles.recentList}>
            {taxReturns.slice(0, 3).map((taxReturn) => (
              <div 
                key={taxReturn.id}
                className={styles.recentItem}
                onClick={() => onSelectReturn(taxReturn)}
              >
                <div className={styles.recentHeader}>
                  <span className={styles.recentYear}>{taxReturn.taxYear}</span>
                  <span className={`${styles.recentStatus} ${getStatusColor(taxReturn.status)}`}>
                    {taxReturn.status.replace('_', ' ')}
                  </span>
                </div>
                <div className={styles.recentDetails}>
                  <span className={styles.recentIncome}>
                    Income: {formatCurrency(taxReturn.totalIncome)}
                  </span>
                  {taxReturn.estimatedRefund && taxReturn.estimatedRefund > 0 && (
                    <span className={styles.recentRefund}>
                      Refund: {formatCurrency(taxReturn.estimatedRefund)}
                    </span>
                  )}
                </div>
                <div className={styles.recentMeta}>
                  Last modified {new Date(taxReturn.lastModified).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className={styles.actionsSection}>
        <h3>Quick Actions</h3>
        <div className={styles.actionGrid}>
          <button 
            className={styles.actionCard}
            onClick={onStartNewFiling}
          >
            <FiPlus className={styles.actionIcon} />
            <div className={styles.actionContent}>
              <div className={styles.actionTitle}>Start New Filing</div>
              <div className={styles.actionDescription}>Begin a new tax return</div>
            </div>
          </button>
          
          <div className={styles.actionCard}>
            <FiUpload className={styles.actionIcon} />
            <div className={styles.actionContent}>
              <div className={styles.actionTitle}>Import Documents</div>
              <div className={styles.actionDescription}>Upload tax documents</div>
            </div>
          </div>
          
          <div className={styles.actionCard}>
            <FiPieChart className={styles.actionIcon} />
            <div className={styles.actionContent}>
              <div className={styles.actionTitle}>View Reports</div>
              <div className={styles.actionDescription}>Tax filing reports</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
