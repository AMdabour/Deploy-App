import React from 'react';
import { CheckCircle, Clock, BarChart3, TrendingUp } from 'lucide-react';

interface TaskStatsProps {
  stats: {
    total: number;
    completed: number;
    pending: number;
    completionRate: number;
    averageDuration?: number;
  };
}

const TaskStats: React.FC<TaskStatsProps> = ({ stats }) => {
  return (
    <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-info/20 rounded-2xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-info" />
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-foreground">
              {stats.total}
            </div>
            <div className="text-sm text-muted-foreground">Total Tasks</div>
          </div>
        </div>
        <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-info to-primary rounded-full w-full"></div>
        </div>
      </div>

      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-success/20 rounded-2xl flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-success" />
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-success">
              {stats.completed}
            </div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
        </div>
        <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-success to-emerald-500 rounded-full transition-all duration-500"
            style={{
              width: `${
                stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
              }%`,
            }}
          ></div>
        </div>
      </div>

      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-warning/20 rounded-2xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-warning" />
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-warning">
              {stats.pending}
            </div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
        </div>
        <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-warning to-orange-500 rounded-full transition-all duration-500"
            style={{
              width: `${
                stats.total > 0 ? (stats.pending / stats.total) * 100 : 0
              }%`,
            }}
          ></div>
        </div>
      </div>

      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-accent" />
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-accent">
              {Math.round(stats.completionRate || 0)}%
            </div>
            <div className="text-sm text-muted-foreground">Completion Rate</div>
          </div>
        </div>
        <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent to-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${stats.completionRate || 0}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default TaskStats;
