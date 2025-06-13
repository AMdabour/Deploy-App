import React from 'react';
import { useNavigate } from 'react-router';
import {
  Calendar,
  Target,
  TrendingUp,
  CheckCircle2,
  Circle,
  MoreVertical,
  Edit,
  Trash2,
  CheckSquare, // Add this import
} from 'lucide-react';
import { Objective, KeyResult } from '../../../types/objectives';

interface ObjectiveCardProps {
  objective: Objective;
  goalTitle?: string;
  goalCategory?: string;
  onEdit?: (objective: Objective) => void;
  onDelete?: (objectiveId: string) => void;
  onUpdateKeyResult?: (
    objectiveId: string,
    keyResultId: string,
    currentValue: number,
    completed: boolean
  ) => void;
  className?: string;
  style?: React.CSSProperties;
}

const ObjectiveCard: React.FC<ObjectiveCardProps> = ({
  objective,
  goalTitle,
  goalCategory,
  onEdit,
  onDelete,
  onUpdateKeyResult,
  className = '',
  style,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const navigate = useNavigate();

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-700 dark:text-green-300';
      case 'paused':
        return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300';
      default:
        return 'bg-blue-500/20 text-blue-700 dark:text-blue-300';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const handleKeyResultUpdate = (keyResult: KeyResult, newValue: number) => {
    if (onUpdateKeyResult) {
      const completed = keyResult.targetValue
        ? newValue >= keyResult.targetValue
        : keyResult.completed;
      onUpdateKeyResult(objective.id, keyResult.id, newValue, completed);
    }
  };

  const handleKeyResultToggle = (keyResult: KeyResult) => {
    if (onUpdateKeyResult) {
      const newCompleted = !keyResult.completed;
      const currentValue =
        newCompleted && keyResult.targetValue
          ? keyResult.targetValue
          : keyResult.currentValue || 0;
      onUpdateKeyResult(objective.id, keyResult.id, currentValue, newCompleted);
    }
  };

  // Add navigation helper function
  const navigateToTasks = () => {
    // Use a more robust navigation approach
    const params = new URLSearchParams();
    params.set('objectiveId', objective.id);
    params.set('search', objective.title);

    navigate(`/dashboard/tasks?${params.toString()}`);
  };

  const completedKeyResults = objective.keyResults.filter(
    (kr) => kr.completed
  ).length;
  const totalKeyResults = objective.keyResults.length;

  return (
    <div
      className={`bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 ${className}`}
      style={style}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span
              className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(
                objective.status
              )}`}
            >
              {objective.status.charAt(0).toUpperCase() +
                objective.status.slice(1)}
            </span>

            {goalCategory && (
              <span className="px-2 py-1 bg-muted rounded-lg text-xs font-medium text-muted-foreground">
                {goalCategory}
              </span>
            )}
          </div>

          <h3 className="text-lg font-semibold text-foreground mb-1">
            {objective.title}
          </h3>

          {goalTitle && (
            <p className="text-sm text-muted-foreground mb-2">
              Goal: {goalTitle}
            </p>
          )}

          {objective.description && (
            <p className="text-sm text-muted-foreground">
              {objective.description}
            </p>
          )}
        </div>

        {/* Actions Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg py-2 min-w-[120px] z-10">
              {onEdit && (
                <button
                  onClick={() => {
                    onEdit(objective);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => {
                    onDelete(objective.id);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium text-foreground">
            {objective.progress}%
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(
              objective.progress
            )}`}
            style={{ width: `${objective.progress}%` }}
          />
        </div>
      </div>

      {/* Target Date */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Calendar className="w-4 h-4" />
        <span>
          Target: {monthNames[objective.targetMonth - 1]} {objective.targetYear}
        </span>
      </div>

      {/* Navigation to Tasks */}
      <div className="mb-4">
        <button
          onClick={navigateToTasks}
          className="flex items-center gap-2 px-3 py-2 bg-info/10 hover:bg-info/20 text-info rounded-lg transition-all duration-200 text-sm font-medium w-full justify-center"
          title="View related tasks"
        >
          <CheckSquare className="w-4 h-4" />
          View Related Tasks
        </button>
      </div>

      {/* Key Results */}
      {objective.keyResults.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Target className="w-4 h-4" />
              Key Results
            </h4>
            <span className="text-xs text-muted-foreground">
              {completedKeyResults}/{totalKeyResults} completed
            </span>
          </div>

          <div className="space-y-2">
            {objective.keyResults.map((keyResult) => (
              <div
                key={keyResult.id}
                className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl hover:bg-muted/40 transition-colors"
              >
                <button
                  onClick={() => handleKeyResultToggle(keyResult)}
                  className="text-primary hover:text-primary/80 transition-colors flex-shrink-0"
                  disabled={!onUpdateKeyResult}
                >
                  {keyResult.completed ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm ${
                      keyResult.completed
                        ? 'line-through text-muted-foreground'
                        : 'text-foreground'
                    }`}
                  >
                    {keyResult.description}
                  </p>

                  {keyResult.targetValue && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <TrendingUp className="w-3 h-3" />
                        <span>
                          {keyResult.currentValue || 0} /{' '}
                          {keyResult.targetValue}
                          {keyResult.unit && ` ${keyResult.unit}`}
                        </span>
                      </div>

                      {keyResult.targetValue > 0 && (
                        <div className="flex-1 max-w-[100px]">
                          <div className="w-full bg-muted rounded-full h-1">
                            <div
                              className="bg-primary h-1 rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min(
                                  ((keyResult.currentValue || 0) /
                                    keyResult.targetValue) *
                                    100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Quick Update Input */}
                {keyResult.targetValue && onUpdateKeyResult && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <input
                      type="number"
                      min="0"
                      max={keyResult.targetValue}
                      value={keyResult.currentValue || 0}
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value) || 0;
                        handleKeyResultUpdate(keyResult, newValue);
                      }}
                      className="w-16 px-2 py-1 text-xs bg-background border border-border rounded focus:ring-1 focus:ring-primary focus:border-transparent"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State for Key Results */}
      {objective.keyResults.length === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          <Target className="w-6 h-6 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No key results defined yet</p>
        </div>
      )}
    </div>
  );
};

export default ObjectiveCard;
