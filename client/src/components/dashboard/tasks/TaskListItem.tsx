import React from 'react';
import { Task } from '@/types/models';
import {
  Clock,
  MapPin,
  Calendar,
  Edit3,
  Trash2,
  CheckCircle,
  Tag,
  AlertCircle,
  Target,
  Lightbulb,
} from 'lucide-react';
import { taskPriorities, taskStatuses } from '@/types/tasks';

interface TaskListItemProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onComplete: () => void;
  isCompleting: boolean;
  setCompletingTask: (taskId: string | null) => void;
}

const TaskListItem: React.FC<TaskListItemProps> = ({
  task,
  onEdit,
  onDelete,
  onComplete,
  isCompleting,
  setCompletingTask,
}) => {
  const priorityConfig = taskPriorities.find((p) => p.value === task.priority);
  const statusConfig = taskStatuses.find((s) => s.value === task.status);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year:
        date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return null;
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const isOverdue =
    task.status !== 'completed' && new Date(task.scheduledDate) < new Date();

  return (
    <div
      className={`bg-card/80 backdrop-blur-sm border rounded-2xl p-6 hover:shadow-lg transition-all duration-300 group ${
        isOverdue
          ? 'border-destructive/30 bg-destructive/5'
          : 'border-border/50'
      }`}
    >
      <div className="flex items-center justify-between">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-4">
            {/* Priority Indicator */}
            <div className="flex-shrink-0 mt-1">
              <div
                className={`w-3 h-3 rounded-full ${
                  task.priority === 'critical'
                    ? 'bg-destructive'
                    : task.priority === 'high'
                    ? 'bg-warning'
                    : task.priority === 'medium'
                    ? 'bg-info'
                    : 'bg-muted'
                }`}
              ></div>
            </div>

            {/* Task Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-foreground text-lg group-hover:text-info transition-colors truncate">
                  {task.title}
                </h3>
                {isOverdue && (
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                )}
              </div>

              {task.description && (
                <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                  {task.description}
                </p>
              )}

              {/* Goal and Objective */}
              {(task.goalTitle || task.objectiveTitle) && (
                <div className="space-y-1 mb-3 p-2 bg-background/30 rounded-lg border border-border/20">
                  {task.goalTitle && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Target className="w-3 h-3" />
                      <span className="font-medium">Goal:</span>
                      <span className="truncate">{task.goalTitle}</span>
                    </div>
                  )}
                  {task.objectiveTitle && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Lightbulb className="w-3 h-3" />
                      <span className="font-medium">Objective:</span>
                      <span className="truncate">{task.objectiveTitle}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Meta Information */}
              <div className="flex items-center gap-6 text-sm text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(task.scheduledDate)}</span>
                  {task.scheduledTime && (
                    <>
                      <Clock className="w-4 h-4 ml-2" />
                      <span>{formatTime(task.scheduledTime)}</span>
                    </>
                  )}
                </div>

                {task.estimatedDuration && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{task.estimatedDuration}m</span>
                  </div>
                )}

                {task.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{task.location}</span>
                  </div>
                )}
              </div>

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  <Tag className="w-3 h-3 text-muted-foreground" />
                  <div className="flex gap-1 flex-wrap">
                    {task.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-muted/50 text-muted-foreground text-xs rounded-lg"
                      >
                        {tag}
                      </span>
                    ))}
                    {task.tags.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{task.tags.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status, Priority, and Actions */}
        <div className="flex items-center gap-4 ml-6">
          {/* Status and Priority */}
          <div className="flex flex-col gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium border text-center ${
                statusConfig?.color || 'bg-muted text-muted-foreground'
              }`}
            >
              {statusConfig?.label || task.status}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium border text-center ${
                priorityConfig?.color || 'bg-muted text-muted-foreground'
              }`}
            >
              {priorityConfig?.icon} {priorityConfig?.label || task.priority}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="p-2 text-muted-foreground hover:text-info hover:bg-info/10 rounded-lg transition-all duration-200"
              title="Edit task"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all duration-200"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {task.status !== 'completed' && (
              <button
                onClick={() => {
                  setCompletingTask(task.id);
                  onComplete();
                }}
                disabled={isCompleting}
                className="flex items-center gap-2 px-4 py-2 bg-success/10 text-success hover:bg-success/20 rounded-lg transition-all duration-200 disabled:opacity-50 ml-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {isCompleting ? 'Completing...' : 'Complete'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskListItem;
