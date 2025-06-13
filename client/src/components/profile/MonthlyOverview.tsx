import React from 'react';
import { UserStats } from '../../pages/Profile';

interface MonthlyOverviewProps {
  userStats: UserStats;
}

const MonthlyOverview: React.FC<MonthlyOverviewProps> = ({ userStats }) => {
  const currentMonth = new Date().toLocaleDateString('en-US', {
    month: 'long',
  });
  const currentYear = new Date().getFullYear();

  // Calculate daily average for the month
  const currentDay = new Date().getDate();
  const dailyAverage =
    currentDay > 0 ? (userStats.monthlyTasks / currentDay).toFixed(1) : '0';

  // Estimate month-end projection
  const daysInMonth = new Date(
    currentYear,
    new Date().getMonth() + 1,
    0
  ).getDate();
  const monthEndProjection = Math.round(
    (userStats.monthlyTasks / currentDay) * daysInMonth
  );

  const monthlyMetrics = [
    {
      label: 'This Month',
      value: userStats.monthlyTasks,
      icon: '📅',
      color: 'from-primary to-primary/80',
      textColor: 'text-primary',
      bgColor: 'bg-primary/10',
      trend: '+12%',
      trendUp: true,
    },
    {
      label: 'Daily Average',
      value: dailyAverage,
      icon: '📊',
      color: 'from-accent to-accent/80',
      textColor: 'text-accent',
      bgColor: 'bg-accent/10',
      trend: '+8%',
      trendUp: true,
    },
    {
      label: 'Week Target',
      value: Math.round(userStats.monthlyTasks / 4),
      icon: '🎯',
      color: 'from-success to-success/80',
      textColor: 'text-success',
      bgColor: 'bg-success/10',
      trend: 'On track',
      trendUp: true,
    },
    {
      label: 'Month Projection',
      value: monthEndProjection,
      icon: '🔮',
      color: 'from-info to-info/80',
      textColor: 'text-info',
      bgColor: 'bg-info/10',
      trend: '+15%',
      trendUp: true,
    },
  ];

  // Generate mock weekly data for visualization
  const weeklyData = [
    {
      week: 'Week 1',
      tasks: Math.round(userStats.monthlyTasks * 0.3),
      completed: Math.round(userStats.monthlyTasks * 0.25),
    },
    {
      week: 'Week 2',
      tasks: Math.round(userStats.monthlyTasks * 0.25),
      completed: Math.round(userStats.monthlyTasks * 0.22),
    },
    {
      week: 'Week 3',
      tasks: Math.round(userStats.monthlyTasks * 0.25),
      completed: Math.round(userStats.monthlyTasks * 0.28),
    },
    {
      week: 'Week 4',
      tasks: Math.round(userStats.monthlyTasks * 0.2),
      completed: Math.round(userStats.monthlyTasks * 0.15),
    },
  ];

  const maxTasks = Math.max(...weeklyData.map((w) => w.tasks));

  return (
    <div className="bg-gradient-to-r from-info/5 to-primary/5 rounded-xl p-6 border border-info/10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-info to-primary rounded-lg flex items-center justify-center">
            <span className="text-white text-lg">📈</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Monthly Overview
            </h3>
            <p className="text-sm text-muted-foreground">
              {currentMonth} {currentYear} productivity summary
            </p>
          </div>
        </div>

        {/* Month Progress */}
        <div className="text-right">
          <div className="text-sm font-semibold text-foreground">
            Day {currentDay} of {daysInMonth}
          </div>
          <div className="text-xs text-muted-foreground">
            {Math.round((currentDay / daysInMonth) * 100)}% through month
          </div>
        </div>
      </div>

      {/* Monthly Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {monthlyMetrics.map((metric) => (
          <div
            key={metric.label}
            className={`${metric.bgColor} rounded-lg p-4 border border-border/20 hover:scale-105 transition-all duration-200 cursor-pointer group relative overflow-hidden`}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-5 group-hover:opacity-10 transition-opacity`}
            />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl group-hover:scale-110 transition-transform">
                  {metric.icon}
                </span>
                <div className="text-right">
                  <div className={`text-xl font-bold ${metric.textColor}`}>
                    {metric.value}
                  </div>
                  <div
                    className={`text-xs flex items-center justify-end space-x-1 ${
                      metric.trendUp ? 'text-success' : 'text-destructive'
                    }`}
                  >
                    <span>{metric.trendUp ? '↗' : '↘'}</span>
                    <span>{metric.trend}</span>
                  </div>
                </div>
              </div>
              <div className="text-xs font-medium text-foreground">
                {metric.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Weekly Breakdown Chart */}
      <div className="bg-background/50 rounded-lg p-4 border border-border/30">
        <h4 className="text-sm font-semibold text-foreground mb-4">
          Weekly Breakdown
        </h4>

        <div className="space-y-4">
          {weeklyData.map((week, index) => (
            <div key={week.week} className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">
                  {week.week}
                </span>
                <span className="text-foreground">
                  {week.completed}/{week.tasks} tasks
                </span>
              </div>

              <div className="flex space-x-1">
                {/* Tasks Bar */}
                <div className="flex-1 bg-muted/30 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-primary/60 to-primary/40 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(week.tasks / maxTasks) * 100}%` }}
                  />
                </div>

                {/* Completed Bar */}
                <div className="flex-1 bg-muted/30 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-success to-success/80 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(week.completed / maxTasks) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-6 mt-4 pt-4 border-t border-border/30">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-2 bg-gradient-to-r from-primary/60 to-primary/40 rounded-full"></div>
            <span className="text-xs text-muted-foreground">Total Tasks</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-2 bg-gradient-to-r from-success to-success/80 rounded-full"></div>
            <span className="text-xs text-muted-foreground">Completed</span>
          </div>
        </div>
      </div>

      {/* Monthly Goals Section */}
      <div className="mt-6 p-4 bg-gradient-to-r from-accent/10 to-success/10 rounded-lg border border-accent/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🏆</span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Monthly Goal
              </p>
              <p className="text-xs text-muted-foreground">
                Stay on track with your targets
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-lg font-bold text-accent">
              {Math.round(
                (userStats.monthlyTasks / (monthEndProjection || 1)) * 100
              )}
              %
            </div>
            <div className="text-xs text-muted-foreground">
              of projected goal
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyOverview;
