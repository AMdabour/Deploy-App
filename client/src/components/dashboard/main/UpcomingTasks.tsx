import React from 'react';
import { Calendar, Clock, Flag, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import Button from '@/components/ui/Button';

interface Task {
  id: string;
  title: string;
  scheduledDate?: string;
  scheduledTime?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  estimatedDuration?: number;
}

interface UpcomingTasksProps {
  tasks: Task[];
}

const UpcomingTasks: React.FC<UpcomingTasksProps> = ({ tasks = [] }) => {
  const navigate = useNavigate();

  // Helper functions
  const isOverdue = (task: Task): boolean => {
    if (!task.scheduledDate) return false;
    const taskDate = new Date(task.scheduledDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return taskDate < today && task.status !== 'completed';
  };

  const isToday = (task: Task): boolean => {
    if (!task.scheduledDate) return false;
    const taskDate = new Date(task.scheduledDate);
    const today = new Date();
    return (
      taskDate.getDate() === today.getDate() &&
      taskDate.getMonth() === today.getMonth() &&
      taskDate.getFullYear() === today.getFullYear()
    );
  };

  const isTomorrow = (task: Task): boolean => {
    if (!task.scheduledDate) return false;
    const taskDate = new Date(task.scheduledDate);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return (
      taskDate.getDate() === tomorrow.getDate() &&
      taskDate.getMonth() === tomorrow.getMonth() &&
      taskDate.getFullYear() === tomorrow.getFullYear()
    );
  };

  const sortedTasks = React.useMemo(() => {
    if (!Array.isArray(tasks)) return [];
    
    return [...tasks]
      .filter(task => task.status !== 'completed')
      .sort((a, b) => {
        const aOverdue = isOverdue(a);
        const bOverdue = isOverdue(b);
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;

        const aToday = isToday(a);
        const bToday = isToday(b);
        if (aToday && !bToday) return -1;
        if (!aToday && bToday) return 1;

        const aTomorrow = isTomorrow(a);
        const bTomorrow = isTomorrow(b);
        if (aTomorrow && !bTomorrow) return -1;
        if (!aTomorrow && bTomorrow) return 1;

        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority] || 1;
        const bPriority = priorityOrder[b.priority] || 1;
        if (aPriority !== bPriority) return bPriority - aPriority;

        if (a.scheduledDate && b.scheduledDate) {
          return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
        }
        if (a.scheduledDate) return -1;
        if (b.scheduledDate) return 1;

        return 0;
      })
      .slice(0, 8);
  }, [tasks]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    if (isToday({ scheduledDate: dateString } as Task)) {
      return 'Today';
    }
    if (isTomorrow({ scheduledDate: dateString } as Task)) {
      return 'Tomorrow';
    }

    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    if (date.getTime() - today.getTime() < oneWeek) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    }

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical':
        return 'text-destructive bg-destructive/10 border-destructive/20';
      case 'high':
        return 'text-warning bg-warning/10 border-warning/20';
      case 'medium':
        return 'text-info bg-info/10 border-info/20';
      case 'low':
        return 'text-success bg-success/10 border-success/20';
      default:
        return 'text-muted-foreground bg-muted/10 border-muted/20';
    }
  };

  const getTaskStatusColor = (task: Task): string => {
    if (isOverdue(task)) {
      return 'border-l-destructive bg-gradient-to-r from-destructive/5 to-transparent border border-destructive/20';
    }
    if (isToday(task)) {
      return 'border-l-primary bg-gradient-to-r from-primary/5 to-transparent border border-primary/20';
    }
    if (isTomorrow(task)) {
      return 'border-l-warning bg-gradient-to-r from-warning/5 to-transparent border border-warning/20';
    }
    return 'border-l-info bg-gradient-to-r from-info/5 to-transparent border border-info/10';
  };

  if (!Array.isArray(tasks) || tasks.length === 0) {
    return (
      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-3xl p-6 hover:shadow-2xl transition-all duration-500 group">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-info to-primary rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                Upcoming Tasks
              </h2>
              <p className="text-sm text-muted-foreground">
                Your scheduled activities
              </p>
            </div>
          </div>
        </div>

        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gradient-to-br from-info/20 to-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-muted-foreground opacity-50" />
          </div>
          <h4 className="font-medium text-foreground mb-2">No upcoming tasks</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Start by creating some tasks to see them here.
          </p>
          <Button
            variant="gradient"
            size="sm"
            onClick={() => navigate('/dashboard/tasks')}
            className="shadow-lg hover:shadow-xl transition-shadow duration-300"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Add Your First Task
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-3xl p-6 hover:shadow-2xl transition-all duration-500 group">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-info to-primary rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
              Upcoming Tasks
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({sortedTasks.length})
              </span>
            </h2>
            <p className="text-sm text-muted-foreground">
              Your scheduled activities
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/dashboard/tasks')}
          className="bg-gradient-to-r from-primary/5 to-accent/5 hover:from-primary/10 hover:to-accent/10 border-primary/20 hover:border-primary/30 text-primary hover:text-primary/80 transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-2 px-4 py-2 rounded-xl"
        >
          <span className="font-medium">View All</span>
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {sortedTasks.map((task, index) => (
          <div
            key={task.id}
            className={`p-4 rounded-xl border-l-4 transition-all duration-200 hover:shadow-md cursor-pointer group animate-in slide-in-from-left ${getTaskStatusColor(task)}`}
            style={{ animationDelay: `${index * 50}ms` }}
            onClick={() => navigate(`/dashboard/tasks?taskId=${task.id}`)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors mb-2">
                  {task.title}
                </h3>
                <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                  {task.scheduledDate && (
                    <div className="flex items-center gap-1 bg-background/60 rounded-lg px-2 py-1">
                      <Calendar className="w-3 h-3" />
                      <span className={isOverdue(task) ? 'text-destructive font-medium' : ''}>
                        {formatDate(task.scheduledDate)}
                      </span>
                    </div>
                  )}
                  {task.scheduledTime && (
                    <div className="flex items-center gap-1 bg-background/60 rounded-lg px-2 py-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(task.scheduledTime)}</span>
                    </div>
                  )}
                  {task.estimatedDuration && (
                    <div className="flex items-center gap-1 bg-background/60 rounded-lg px-2 py-1">
                      <span>~{task.estimatedDuration}min</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <div className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 hover:scale-105 ${getPriorityColor(task.priority)}`}>
                  <Flag className="w-3 h-3 inline mr-1" />
                  {task.priority}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Footer */}
      {sortedTasks.length >= 8 && (
        <div className="mt-6 pt-4 border-t border-gradient-to-r from-border/50 via-border/30 to-border/50">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/dashboard/tasks')}
            className="w-full bg-gradient-to-r from-background/60 to-background/80 hover:from-primary/5 hover:to-primary/10 border-border/50 hover:border-primary/30 transition-all duration-300"
          >
            <span>View More Tasks</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Summary Stats */}
      {sortedTasks.length > 0 && (
        <div className="mt-6 pt-4 border-t border-border/30">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-destructive/10 to-destructive/5 rounded-xl p-3 border border-destructive/20">
              <div className="text-xs text-muted-foreground mb-1">Overdue</div>
              <div className="text-lg font-bold text-destructive">
                {sortedTasks.filter(isOverdue).length}
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-3 border border-primary/20">
              <div className="text-xs text-muted-foreground mb-1">Today</div>
              <div className="text-lg font-bold text-primary">
                {sortedTasks.filter(isToday).length}
              </div>
            </div>
            <div className="bg-gradient-to-br from-warning/10 to-warning/5 rounded-xl p-3 border border-warning/20">
              <div className="text-xs text-muted-foreground mb-1">Tomorrow</div>
              <div className="text-lg font-bold text-warning">
                {sortedTasks.filter(isTomorrow).length}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpcomingTasks;
