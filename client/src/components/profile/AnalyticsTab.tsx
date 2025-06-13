import React from 'react';
import Button from '../ui/Button';
import GoalsOverview from './GoalsOverview';
import TaskPerformance from './TaskPerformance';
import MonthlyOverview from './MonthlyOverview';
import { UserStats } from '../../pages/Profile';

interface AnalyticsTabProps {
  userStats: UserStats | null;
  statsLoading: boolean;
  onRefreshAnalytics: () => void;
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  userStats,
  statsLoading,
  onRefreshAnalytics,
}) => (
  <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-8 shadow-xl animate-in fade-in duration-300">
    <div className="flex items-center space-x-3 mb-8">
      <div className="w-12 h-12 bg-gradient-to-r from-info to-primary rounded-xl flex items-center justify-center">
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Analytics Dashboard
        </h2>
        <p className="text-muted-foreground">
          Your productivity insights and performance metrics
        </p>
      </div>
    </div>

    {statsLoading ? (
      <AnalyticsLoadingSkeleton />
    ) : userStats ? (
      <div className="space-y-8">
        <GoalsOverview userStats={userStats} />
        <TaskPerformance userStats={userStats} />
        <MonthlyOverview userStats={userStats} />
      </div>
    ) : (
      <AnalyticsEmptyState onRefresh={onRefreshAnalytics} />
    )}
  </div>
);

const AnalyticsLoadingSkeleton: React.FC = () => (
  <div className="space-y-6">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="bg-muted/20 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-muted/30 rounded mb-4 w-1/3"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, j) => (
            <div key={j} className="h-16 bg-muted/20 rounded"></div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const AnalyticsEmptyState: React.FC<{ onRefresh: () => void }> = ({
  onRefresh,
}) => (
  <div className="text-center py-12">
    <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
      <svg
        className="w-8 h-8 text-muted-foreground"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-2">
      No Analytics Data Available
    </h3>
    <p className="text-muted-foreground mb-4">
      Start creating goals and tasks to see your analytics
    </p>
    <Button variant="primary" size="md" fullWidth={false} onClick={onRefresh}>
      Refresh Analytics
    </Button>
  </div>
);

export default AnalyticsTab;
