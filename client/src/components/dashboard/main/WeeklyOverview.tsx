import React, { useMemo, useEffect, useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface WeeklyOverviewProps {
  stats: {
    allTasks: any[];
    tasks: {
      total: number;
      completed: number;
      pending: number;
      overdue: number;
      completionRate: number;
    };
  } | null;
}

const WeeklyOverview: React.FC<WeeklyOverviewProps> = ({ stats }) => {
  // Add a refresh trigger state
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Listen for task-related events to trigger refresh
  useEffect(() => {
    const handleTaskEvent = (event: CustomEvent) => {
      console.log('WeeklyOverview: Received task event:', event.type);
      // Force component to recalculate data
      setRefreshTrigger((prev) => prev + 1);
    };

    // Listen to all task-related events
    window.addEventListener('taskCreated', handleTaskEvent as EventListener);
    window.addEventListener('taskUpdated', handleTaskEvent as EventListener);
    window.addEventListener('taskCompleted', handleTaskEvent as EventListener);
    window.addEventListener('taskDeleted', handleTaskEvent as EventListener);

    return () => {
      window.removeEventListener('taskCreated', handleTaskEvent as EventListener);
      window.removeEventListener('taskUpdated', handleTaskEvent as EventListener);
      window.removeEventListener('taskCompleted', handleTaskEvent as EventListener);
      window.removeEventListener('taskDeleted', handleTaskEvent as EventListener);
    };
  }, []);

  // Memoize weekly data generation with proper dependencies
  const weeklyData = useMemo(() => {
    console.log('WeeklyOverview: Recalculating weekly data, trigger:', refreshTrigger);

    if (!stats?.allTasks || !Array.isArray(stats.allTasks)) {
      console.log('WeeklyOverview: No tasks data available');
      return [];
    }

    const today = new Date();
    const weeklyDataArray = [];
    const allTasks = stats.allTasks;

    console.log('WeeklyOverview: Processing tasks:', allTasks.length, 'refresh trigger:', refreshTrigger);

    // Generate data for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];

      // Filter tasks for this specific day with more robust date matching
      const dayTasks = allTasks.filter((task: any) => {
        if (!task.scheduledDate) return false;

        try {
          const taskDate = new Date(task.scheduledDate);
          // Handle timezone issues by comparing date strings
          const taskDateString = taskDate.toISOString().split('T')[0];
          return taskDateString === dateString;
        } catch (error) {
          console.warn('Invalid date in task:', task.scheduledDate);
          return false;
        }
      });

      // Count completed and total tasks for this day
      const completedTasks = dayTasks.filter(
        (task: any) => task.status === 'completed'
      );

      const dayData = {
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: dateString,
        fullDate: date,
        completed: completedTasks.length,
        total: dayTasks.length,
        completionRate:
          dayTasks.length > 0
            ? Math.round((completedTasks.length / dayTasks.length) * 100)
            : 0,
        isToday: dateString === today.toISOString().split('T')[0],
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
      };

      weeklyDataArray.push(dayData);
    }

    console.log('WeeklyOverview: Generated weekly data:', weeklyDataArray);
    return weeklyDataArray;
  }, [stats?.allTasks, refreshTrigger]); // Include refreshTrigger in dependencies

  // Memoize calculations to prevent re-computation
  const weeklyCalculations = useMemo(() => {
    if (weeklyData.length === 0) {
      return {
        maxTasks: 1,
        weeklyTotals: { completed: 0, total: 0, averageCompletion: 0 },
        trendDirection: 'stable' as const,
        trendInfo: { icon: Minus, color: 'text-muted-foreground', text: 'Stable' },
      };
    }

    const maxTasks = Math.max(...weeklyData.map((d) => d.total), 1);

    // Calculate weekly totals and trends
    const weeklyTotals = {
      completed: weeklyData.reduce((sum, day) => sum + day.completed, 0),
      total: weeklyData.reduce((sum, day) => sum + day.total, 0),
      averageCompletion:
        weeklyData.length > 0
          ? weeklyData.reduce((sum, day) => sum + day.completionRate, 0) /
            weeklyData.length
          : 0,
    };

    // Calculate trends (compare first half vs second half of week)
    const firstHalf = weeklyData.slice(0, 3);
    const secondHalf = weeklyData.slice(4, 7);

    const firstHalfAvg =
      firstHalf.length > 0
        ? firstHalf.reduce((sum, day) => sum + day.completionRate, 0) /
          firstHalf.length
        : 0;
    const secondHalfAvg =
      secondHalf.length > 0
        ? secondHalf.reduce((sum, day) => sum + day.completionRate, 0) /
          secondHalf.length
        : 0;

    const trend = secondHalfAvg - firstHalfAvg;
    const trendDirection = trend > 5 ? 'up' : trend < -5 ? 'down' : 'stable';

    // Get trend icon and color
    const getTrendIcon = () => {
      switch (trendDirection) {
        case 'up':
          return { icon: TrendingUp, color: 'text-success', text: 'Improving' };
        case 'down':
          return { icon: TrendingDown, color: 'text-destructive', text: 'Declining' };
        default:
          return { icon: Minus, color: 'text-muted-foreground', text: 'Stable' };
      }
    };

    const trendInfo = getTrendIcon();

    return {
      maxTasks,
      weeklyTotals,
      trendDirection,
      trendInfo,
    };
  }, [weeklyData]);

  const { maxTasks, weeklyTotals, trendDirection, trendInfo } = weeklyCalculations;
  const TrendIcon = trendInfo.icon;

  console.log('WeeklyOverview: Render with data:', {
    weeklyDataLength: weeklyData.length,
    weeklyTotals,
    refreshTrigger,
  });

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-2xl flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Weekly Overview</h3>
            <p className="text-sm text-muted-foreground">
              Last 7 days task completion
            </p>
          </div>
        </div>

        {/* Trend indicator */}
        <div className="flex items-center gap-2 px-3 py-1 bg-background/50 rounded-full">
          <TrendIcon className={`w-4 h-4 ${trendInfo.color}`} />
          <span className={`text-sm font-medium ${trendInfo.color}`}>
            {trendInfo.text}
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Chart */}
        <div className="flex items-end gap-2 h-32">
          {weeklyData.map((day, index) => {
            const barHeight = maxTasks > 0 ? (day.total / maxTasks) * 100 : 0;
            const completedHeight =
              day.total > 0 ? (day.completed / day.total) * 100 : 0;

            return (
              <div
                key={`${day.date}-${refreshTrigger}`} // Include refreshTrigger in key to force re-render
                className="flex-1 flex flex-col items-center group"
              >
                <div className="w-full flex flex-col gap-1 h-24 justify-end relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-background/95 backdrop-blur-sm border border-border/50 rounded-lg px-3 py-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 shadow-lg">
                    <div className="font-semibold">{day.fullDate.toLocaleDateString()}</div>
                    <div>{day.completed}/{day.total} tasks completed</div>
                    {day.total > 0 && (
                      <div className="text-accent">{day.completionRate}% completion</div>
                    )}
                  </div>

                  {/* Task bar */}
                  <div
                    className={`w-full relative overflow-hidden transition-all duration-500 hover:scale-105 ${
                      day.isToday
                        ? 'bg-primary/20 border-2 border-primary/40'
                        : day.isWeekend
                        ? 'bg-muted/20'
                        : 'bg-muted/30'
                    } rounded-t`}
                    style={{ height: `${Math.max(barHeight, 4)}px` }}
                  >
                    {/* Completed tasks overlay */}
                    {day.total > 0 && (
                      <div
                        className="w-full bg-gradient-to-t from-success via-emerald-400 to-emerald-300 rounded-t transition-all duration-700 absolute bottom-0"
                        style={{
                          height: `${completedHeight}%`,
                        }}
                      />
                    )}

                    {/* Today indicator */}
                    {day.isToday && (
                      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-primary rounded-full"></div>
                    )}
                  </div>
                </div>

                {/* Day label with completion indicator */}
                <div className="flex flex-col items-center mt-2">
                  <span className={`text-xs font-medium ${
                    day.isToday 
                      ? 'text-primary' 
                      : day.isWeekend 
                      ? 'text-muted-foreground/70' 
                      : 'text-muted-foreground'
                  }`}>
                    {day.day}
                  </span>
                  {day.total > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          day.completionRate === 100
                            ? 'bg-success'
                            : day.completionRate >= 80
                            ? 'bg-warning'
                            : day.completionRate >= 50
                            ? 'bg-info'
                            : 'bg-muted-foreground/50'
                        }`}
                      ></div>
                      <span className="text-xs text-muted-foreground">
                        {day.completionRate}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary with enhanced metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gradient-to-br from-success/10 to-emerald-500/5 rounded-xl border border-success/20">
            <div className="text-2xl font-bold text-success">
              {weeklyTotals.completed}
            </div>
            <div className="text-xs text-muted-foreground">Completed</div>
            {weeklyTotals.total > 0 && (
              <div className="text-xs text-success/70 mt-1">
                {Math.round(
                  (weeklyTotals.completed / weeklyTotals.total) * 100
                )}
                % done
              </div>
            )}
          </div>

          <div className="text-center p-3 bg-gradient-to-br from-info/10 to-blue-500/5 rounded-xl border border-info/20">
            <div className="text-2xl font-bold text-info">
              {weeklyTotals.total}
            </div>
            <div className="text-xs text-muted-foreground">Today Tasks</div>
            <div className="text-xs text-info/70 mt-1">
              {Math.round(weeklyTotals.total / 7)} daily avg
            </div>
          </div>

          <div className="text-center p-3 bg-gradient-to-br from-accent/10 to-purple-500/5 rounded-xl border border-accent/20">
            <div className="text-2xl font-bold text-accent">
              {Math.round(weeklyTotals.averageCompletion)}%
            </div>
            <div className="text-xs text-muted-foreground">Avg Success</div>
            <div className="text-xs text-accent/70 mt-1">
              {weeklyTotals.averageCompletion >= 80
                ? 'Excellent'
                : weeklyTotals.averageCompletion >= 60
                ? 'Good'
                : weeklyTotals.averageCompletion >= 40
                ? 'Fair'
                : 'Needs focus'}
            </div>
          </div>
        </div>

        {/* Weekly insights */}
        {weeklyTotals.total > 0 && (
          <div className="mt-4 p-4 bg-background/50 rounded-xl border border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-xs font-medium text-foreground">
                Weekly Insight
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {weeklyTotals.averageCompletion >= 80
                ? "🎉 Outstanding week! You're maintaining excellent productivity."
                : weeklyTotals.averageCompletion >= 60
                ? '👍 Good progress this week. Keep up the momentum!'
                : weeklyTotals.averageCompletion >= 40
                ? '📈 Room for improvement. Consider breaking down larger tasks.'
                : '💪 Focus on completing smaller tasks first to build momentum.'}
              {trendDirection === 'up' && ' Your completion rate is trending upward! 📈'}
              {trendDirection === 'down' && ' Consider reviewing your task prioritization. 🔍'}
            </p>
          </div>
        )}

        {/* Empty state */}
        {weeklyTotals.total === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h4 className="font-medium text-foreground mb-2">No tasks this week</h4>
            <p className="text-sm text-muted-foreground">
              Start by creating some tasks to see your weekly progress here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeeklyOverview;
