import React from 'react';
import {
  Plus,
  CheckSquare,
  Calendar,
  List,
  Grid,
  BarChart3,
  Clock,
  TrendingUp,
} from 'lucide-react';
import Button from '@/components/ui/Button';

interface TasksHeaderProps {
  onCreateTask: () => void;
  viewMode: 'grid' | 'list' | 'calendar';
  onViewModeChange: (mode: 'grid' | 'list' | 'calendar') => void;
  stats: any;
}

const TasksHeader: React.FC<TasksHeaderProps> = ({
  onCreateTask,
  viewMode,
  onViewModeChange,
  stats,
}) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-info/10 via-primary/10 to-accent/10 rounded-3xl p-8 mb-8 border border-border/50">
      <div className="absolute inset-0 bg-gradient-to-r from-info/5 to-transparent animate-pulse"></div>

      {/* Floating particles effect */}
      <div className="absolute inset-0">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 bg-info/20 rounded-full animate-bounce`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          ></div>
        ))}
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between space-y-6 lg:space-y-0">
        <div className="text-center lg:text-left">
          <div className="flex items-center gap-3 mb-4 justify-center lg:justify-start">
            <div className="w-14 h-14 bg-gradient-to-br from-info to-primary rounded-2xl flex items-center justify-center shadow-lg">
              <CheckSquare className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-info to-primary bg-clip-text text-transparent">
                Tasks Hub
              </h1>
              <p className="text-sm text-info/60 font-medium">
                Daily Execution Center
              </p>
            </div>
          </div>
          <p className="text-muted-foreground text-lg mb-6">
            Transform your objectives into actionable daily tasks and track your
            progress
          </p>

          {/* Statistics */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-background/80 backdrop-blur-sm rounded-2xl p-4 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <CheckSquare className="w-4 h-4 text-info" />
                  <span className="text-xs text-muted-foreground font-medium">
                    Today Tasks
                  </span>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {stats.total || 0}
                </div>
              </div>
              <div className="bg-background/80 backdrop-blur-sm rounded-2xl p-4 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span className="text-xs text-muted-foreground font-medium">
                    Completed
                  </span>
                </div>
                <div className="text-2xl font-bold text-success">
                  {stats.completed || 0}
                </div>
              </div>
              <div className="bg-background/80 backdrop-blur-sm rounded-2xl p-4 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-warning" />
                  <span className="text-xs text-muted-foreground font-medium">
                    Pending
                  </span>
                </div>
                <div className="text-2xl font-bold text-warning">
                  {stats.pending || 0}
                </div>
              </div>
              <div className="bg-background/80 backdrop-blur-sm rounded-2xl p-4 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-accent" />
                  <span className="text-xs text-muted-foreground font-medium">
                    Completion
                  </span>
                </div>
                <div className="text-2xl font-bold text-accent">
                  {stats.completionRate
                    ? `${Math.round(stats.completionRate)}%`
                    : '0%'}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Button
            variant="gradient"
            size="lg"
            fullWidth={false}
            onClick={onCreateTask}
            className="min-w-[200px] shadow-2xl"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Task
          </Button>

          <div className="flex bg-card/60 border border-border/50 rounded-xl p-1">
            <button
              onClick={() => onViewModeChange('list')}
              className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${
                viewMode === 'list'
                  ? 'bg-info text-info-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <List className="w-4 h-4" />
              List
            </button>
            <button
              onClick={() => onViewModeChange('grid')}
              className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${
                viewMode === 'grid'
                  ? 'bg-info text-info-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Grid className="w-4 h-4" />
              Grid
            </button>
            <button
              onClick={() => onViewModeChange('calendar')}
              className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${
                viewMode === 'calendar'
                  ? 'bg-info text-info-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Calendar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasksHeader;
