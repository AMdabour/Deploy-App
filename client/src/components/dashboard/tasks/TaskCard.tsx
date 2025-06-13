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

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onComplete: () => void;
  isCompleting: boolean;
  setCompletingTask: (taskId: string | null) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
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
    <div className="group bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-lg leading-tight mb-2 group-hover:text-info transition-colors">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
              {task.description}
            </p>
          )}
        </div>
        {isOverdue && (
          <AlertCircle className="w-5 h-5 text-destructive ml-2 flex-shrink-0" />
        )}
      </div>

      {/* Status and Priority */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium border ${
            statusConfig?.color || 'bg-muted text-muted-foreground'
          }`}
        >
          {statusConfig?.label || task.status}
        </span>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium border ${
            priorityConfig?.color || 'bg-muted text-muted-foreground'
          }`}
        >
          {priorityConfig?.icon} {priorityConfig?.label || task.priority}
        </span>
      </div>

      {/* Date and Time */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{task.estimatedDuration} minutes</span>
          </div>
        )}

        {task.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="truncate">{task.location}</span>
          </div>
        )}
      </div>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex items-center gap-1 mb-4 flex-wrap">
          <Tag className="w-3 h-3 text-muted-foreground" />
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
      )}

      {/* Enhanced relationships display */}
      {(task.goalTitle || task.objectiveTitle) && (
        <div className="space-y-2 mb-4 p-3 bg-background/50 rounded-xl border border-border/30">
          {task.goalTitle && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="w-3 h-3" />
              <span className="font-medium">Goal:</span>
              <span className="truncate">{task.goalTitle}</span>
            </div>
          )}
          {task.objectiveTitle && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lightbulb className="w-3 h-3" />
              <span className="font-medium">Objective:</span>
              <span className="truncate">{task.objectiveTitle}</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border/30">
        <div className="flex gap-2">
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
        </div>

        {task.status !== 'completed' && (
          <button
            onClick={() => {
              setCompletingTask(task.id);
              onComplete();
            }}
            disabled={isCompleting}
            className="flex items-center gap-2 px-4 py-2 bg-success/10 text-success hover:bg-success/20 rounded-lg transition-all duration-200 disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">
              {isCompleting ? 'Completing...' : 'Complete'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
