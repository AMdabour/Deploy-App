import React from 'react';
import { CheckCircle, Calendar, Clock, Target, Lightbulb } from 'lucide-react';

interface RecentActivityProps {
  tasks: any[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ tasks = [] }) => {
  // Ensure tasks is always an array
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No date';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-3xl p-6 hover:shadow-2xl transition-all duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-success to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
          <CheckCircle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">Latest completions</p>
        </div>
      </div>

      <div className="space-y-4">
        {safeTasks.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">No recent activity</p>
            <p className="text-muted-foreground text-xs mt-1">
              Complete some tasks to see them here
            </p>
          </div>
        ) : (
          safeTasks.map((task, index) => (
            <div
              key={task.id || index}
              className="flex items-start gap-3 p-3 bg-background/60 rounded-xl border border-border/30 hover:bg-background/80 transition-all duration-200"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-8 h-8 bg-success/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <CheckCircle className="w-4 h-4 text-success" />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground text-sm line-clamp-2 mb-1">
                  {task.title || 'Untitled Task'}
                </h4>

                {task.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                    {task.description}
                  </p>
                )}

                {/* Show relationships if available */}
                {(task.goalTitle || task.objectiveTitle) && (
                  <div className="space-y-1 mb-2">
                    {task.goalTitle && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Target className="w-3 h-3" />
                        <span className="truncate">{task.goalTitle}</span>
                      </div>
                    )}
                    {task.objectiveTitle && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Lightbulb className="w-3 h-3" />
                        <span className="truncate">{task.objectiveTitle}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {formatDate(
                      task.completedAt || task.updatedAt || task.createdAt
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {safeTasks.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border/30">
          <p className="text-xs text-muted-foreground text-center">
            Showing {safeTasks.length} recent{' '}
            {safeTasks.length === 1 ? 'completion' : 'completions'}
          </p>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
