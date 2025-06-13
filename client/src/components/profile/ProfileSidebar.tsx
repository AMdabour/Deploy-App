import React from 'react';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import { UserStats } from '../../pages/Profile';

interface ProfileSidebarProps {
  userStats: UserStats | null;
  statsLoading: boolean;
  isSaving: boolean;
  onSave: () => void;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  userStats,
  statsLoading,
  isSaving,
  onSave,
}) => (
  <div className="xl:col-span-1 space-y-6">
    {/* Save Button */}
    <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-xl sticky top-6">
      <Button
        onClick={onSave}
        variant="gradient"
        size="md"
        loading={isSaving}
        disabled={isSaving}
        fullWidth={true}
        className="text-lg py-4 mb-4"
      >
        {isSaving ? 'Saving Changes...' : 'Save Changes'}
      </Button>

      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>

    {/* Quick Stats */}
    <div className="bg-gradient-to-br from-primary/10 via-accent/10 to-success/10 border border-primary/20 rounded-2xl p-6 backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center">
        <span className="mr-2">📊</span>
        Quick Stats
      </h3>
      <div className="space-y-4">
        {statsLoading ? (
          <LoadingSpinner
            size="sm"
            fullScreen={false}
            message="Loading stats..."
          />
        ) : userStats ? (
          <QuickStatsDisplay userStats={userStats} />
        ) : (
          <div className="text-center text-muted-foreground">
            <p className="text-sm">No stats available</p>
          </div>
        )}
      </div>
    </div>
  </div>
);

const QuickStatsDisplay: React.FC<{ userStats: UserStats }> = ({
  userStats,
}) => (
  <>
    <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
      <span className="text-sm text-muted-foreground">Goals</span>
      <span className="font-semibold text-primary">{userStats.totalGoals}</span>
    </div>
    <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
      <span className="text-sm text-muted-foreground">Active</span>
      <span className="font-semibold text-success">
        {userStats.activeGoals}
      </span>
    </div>
    <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
      <span className="text-sm text-muted-foreground">Tasks</span>
      <span className="font-semibold text-info">{userStats.totalTasks}</span>
    </div>
    <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
      <span className="text-sm text-muted-foreground">Completion</span>
      <span className="font-semibold text-accent">
        {userStats.taskCompletionRate.toFixed(1)}%
      </span>
    </div>
  </>
);

export default ProfileSidebar;
