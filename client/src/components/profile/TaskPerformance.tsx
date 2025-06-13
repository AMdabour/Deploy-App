import React from 'react';
import { UserStats } from '../../pages/Profile';

interface TaskPerformanceProps {
  userStats: UserStats;
}

const TaskPerformance: React.FC<TaskPerformanceProps> = ({ userStats }) => {
  const completedTasks = Math.round(
    (userStats.totalTasks * userStats.taskCompletionRate) / 100
  );
  const pendingTasks = userStats.totalTasks - completedTasks;

  const performanceMetrics = [
    {
      label: 'Total Tasks',
      value: userStats.totalTasks,
      icon: '📋',
      color: 'from-primary to-primary/80',
      textColor: 'text-primary',
      bgColor: 'bg-primary/10',
      description: 'All time tasks',
    },
    {
      label: 'Completed',
      value: completedTasks,
      icon: '✅',
      color: 'from-success to-success/80',
      textColor: 'text-success',
      bgColor: 'bg-success/10',
      description: 'Successfully finished',
    },
    {
      label: 'Pending',
      value: pendingTasks,
      icon: '⏳',
      color: 'from-warning to-warning/80',
      textColor: 'text-warning',
      bgColor: 'bg-warning/10',
      description: 'In progress or waiting',
    },
    {
      label: 'Success Rate',
      value: `${userStats.taskCompletionRate.toFixed(1)}%`,
      icon: '🎯',
      color: 'from-info to-info/80',
      textColor: 'text-info',
      bgColor: 'bg-info/10',
      description: 'Completion efficiency',
    },
  ];

  const getPerformanceLevel = (rate: number) => {
    if (rate >= 90)
      return { level: 'Excellent', color: 'text-success', emoji: '🏆' };
    if (rate >= 75)
      return { level: 'Good', color: 'text-primary', emoji: '👍' };
    if (rate >= 60)
      return { level: 'Fair', color: 'text-warning', emoji: '👌' };
    return {
      level: 'Needs Improvement',
      color: 'text-destructive',
      emoji: '📈',
    };
  };

  const performance = getPerformanceLevel(userStats.taskCompletionRate);

  return (
    <div className="bg-gradient-to-r from-accent/5 to-success/5 rounded-xl p-6 border border-accent/10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-accent to-success rounded-lg flex items-center justify-center">
            <span className="text-white text-lg">⚡</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Task Performance
            </h3>
            <p className="text-sm text-muted-foreground">
              Your productivity metrics and efficiency
            </p>
          </div>
        </div>

        {/* Performance Badge */}
        <div className="flex items-center space-x-2 px-3 py-2 bg-background/70 rounded-lg border border-border/30">
          <span className="text-lg">{performance.emoji}</span>
          <div className="text-right">
            <div className={`text-sm font-semibold ${performance.color}`}>
              {performance.level}
            </div>
            <div className="text-xs text-muted-foreground">Performance</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {performanceMetrics.map((metric, index) => (
          <div
            key={metric.label}
            className={`${metric.bgColor} rounded-lg p-4 border border-border/20 hover:scale-105 transition-all duration-200 cursor-pointer group relative overflow-hidden`}
          >
            {/* Background decoration */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-5 group-hover:opacity-10 transition-opacity`}
            />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl group-hover:scale-110 transition-transform">
                  {metric.icon}
                </span>
                <div className={`text-2xl font-bold ${metric.textColor}`}>
                  {metric.value}
                </div>
              </div>
              <div className="text-xs font-medium text-foreground mb-1">
                {metric.label}
              </div>
              <div className="text-xs text-muted-foreground">
                {metric.description}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Task Completion Visualization */}
      <div className="bg-background/50 rounded-lg p-4 border border-border/30">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-foreground">
            Task Completion Breakdown
          </h4>
          <span className="text-xs text-muted-foreground">
            {userStats.totalTasks} total tasks
          </span>
        </div>

        <div className="space-y-3">
          {/* Completed Tasks Bar */}
          <div className="flex items-center space-x-3">
            <div className="w-20 text-xs text-muted-foreground">Completed</div>
            <div className="flex-1 bg-muted/30 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-success to-success/80 h-2 rounded-full transition-all duration-500"
                style={{ width: `${userStats.taskCompletionRate}%` }}
              />
            </div>
            <div className="w-12 text-xs text-success font-medium text-right">
              {completedTasks}
            </div>
          </div>

          {/* Pending Tasks Bar */}
          <div className="flex items-center space-x-3">
            <div className="w-20 text-xs text-muted-foreground">Pending</div>
            <div className="flex-1 bg-muted/30 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-warning to-warning/80 h-2 rounded-full transition-all duration-500"
                style={{ width: `${100 - userStats.taskCompletionRate}%` }}
              />
            </div>
            <div className="w-12 text-xs text-warning font-medium text-right">
              {pendingTasks}
            </div>
          </div>
        </div>

        {/* Performance Tips */}
        {userStats.taskCompletionRate < 75 && (
          <div className="mt-4 p-3 bg-gradient-to-r from-info/10 to-primary/10 rounded-lg border border-info/20">
            <div className="flex items-start space-x-2">
              <svg
                className="w-4 h-4 text-info mt-0.5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="text-xs font-medium text-info">
                  Productivity Tip
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Consider breaking down larger tasks or adjusting your task
                  duration preferences to improve completion rates.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskPerformance;
