import React from 'react';
import { UserStats } from '../../pages/Profile';

interface GoalsOverviewProps {
  userStats: UserStats;
}

const GoalsOverview: React.FC<GoalsOverviewProps> = ({ userStats }) => {
  const completionRate =
    userStats.totalGoals > 0
      ? ((userStats.totalGoals - userStats.activeGoals) /
          userStats.totalGoals) *
        100
      : 0;

  const goalStats = [
    {
      label: 'Total Goals',
      value: userStats.totalGoals,
      icon: '🎯',
      color: 'from-primary to-primary/80',
      textColor: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Active Goals',
      value: userStats.activeGoals,
      icon: '🚀',
      color: 'from-success to-success/80',
      textColor: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Completed Goals',
      value: userStats.totalGoals - userStats.activeGoals,
      icon: '✅',
      color: 'from-accent to-accent/80',
      textColor: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      label: 'Completion Rate',
      value: `${completionRate.toFixed(1)}%`,
      icon: '📈',
      color: 'from-info to-info/80',
      textColor: 'text-info',
      bgColor: 'bg-info/10',
    },
  ];

  return (
    <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl p-6 border border-primary/10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
            <span className="text-white text-lg">🎯</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Goals Overview
            </h3>
            <p className="text-sm text-muted-foreground">
              Your goal achievement progress
            </p>
          </div>
        </div>

        {/* Progress Ring */}
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-muted/30"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${completionRate * 1.76} 176`}
              className="text-primary transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-semibold text-foreground">
              {completionRate.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {goalStats.map((stat, index) => (
          <div
            key={stat.label}
            className={`${stat.bgColor} rounded-lg p-4 border border-border/20 hover:scale-105 transition-all duration-200 cursor-pointer group`}
          >
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-2xl group-hover:scale-110 transition-transform">
                {stat.icon}
              </span>
              <div className="flex-1">
                <div className={`text-2xl font-bold ${stat.textColor}`}>
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            </div>

            {/* Mini progress bar for visual appeal */}
            <div className="w-full bg-muted/20 rounded-full h-1 mt-3">
              <div
                className={`bg-gradient-to-r ${stat.color} h-1 rounded-full transition-all duration-500`}
                style={{
                  width:
                    index === 0
                      ? '100%'
                      : index === 1
                      ? `${
                          (userStats.activeGoals /
                            Math.max(userStats.totalGoals, 1)) *
                          100
                        }%`
                      : index === 2
                      ? `${completionRate}%`
                      : `${completionRate}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Goal Status Indicator */}
      <div className="mt-6 p-4 bg-background/50 rounded-lg border border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                userStats.activeGoals > 0
                  ? 'bg-success animate-pulse'
                  : 'bg-muted'
              }`}
            />
            <span className="text-sm font-medium text-foreground">
              {userStats.activeGoals > 0
                ? `${userStats.activeGoals} goal${
                    userStats.activeGoals > 1 ? 's' : ''
                  } in progress`
                : 'No active goals'}
            </span>
          </div>

          {userStats.totalGoals > 0 && (
            <div className="text-xs text-muted-foreground">
              {userStats.totalGoals - userStats.activeGoals} completed
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoalsOverview;
