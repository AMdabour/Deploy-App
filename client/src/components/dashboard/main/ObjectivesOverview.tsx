import React from 'react';
import {
  Target,
  Calendar,
  TrendingUp,
  ArrowRight,
  Lightbulb,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { Link } from 'react-router';
import Button from '@/components/ui/Button';

interface ObjectivesOverviewProps {
  objectives:
    | {
        total: number;
        active: number;
        completed: number;
        thisMonth: number;
      }
    | undefined;
}

const ObjectivesOverview: React.FC<ObjectivesOverviewProps> = ({
  objectives,
}) => {
  if (!objectives) return null;

  // Calculate completion rate
  const completionRate =
    objectives.total > 0
      ? Math.round((objectives.completed / objectives.total) * 100)
      : 0;

  // Calculate progress status
  const getProgressStatus = () => {
    if (completionRate >= 80)
      return {
        text: 'Excellent',
        color: 'text-success',
        bgColor: 'bg-success/10',
      };
    if (completionRate >= 60)
      return { text: 'Good', color: 'text-info', bgColor: 'bg-info/10' };
    if (completionRate >= 40)
      return { text: 'Fair', color: 'text-warning', bgColor: 'bg-warning/10' };
    return {
      text: 'Needs Focus',
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    };
  };

  const progressStatus = getProgressStatus();

  // Calculate this month's progress
  const thisMonthProgress =
    objectives.thisMonth > 0
      ? Math.round((objectives.completed / objectives.thisMonth) * 100)
      : 0;

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-3xl p-6 hover:shadow-2xl transition-all duration-500 group">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-accent to-info rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            <Lightbulb className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground group-hover:text-accent transition-colors">
              Monthly Objectives
            </h3>
            <p className="text-sm text-muted-foreground">
              Strategic goal milestones
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/dashboard/objectives">
            <Button
              variant="subtle"
              size="sm"
              className="text-muted-foreground hover:text-accent"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-2xl p-4 border border-accent/20 hover:border-accent/30 transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-accent" />
            <span className="text-xs text-muted-foreground font-medium">
              Active
            </span>
          </div>
          <div className="text-2xl font-bold text-accent">
            {objectives.active}
          </div>
          <div className="text-xs text-accent/70 mt-1">In Progress</div>
        </div>

        <div className="bg-gradient-to-br from-success/10 to-success/5 rounded-2xl p-4 border border-success/20 hover:border-success/30 transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-success" />
            <span className="text-xs text-muted-foreground font-medium">
              Completed
            </span>
          </div>
          <div className="text-2xl font-bold text-success">
            {objectives.completed}
          </div>
          <div className="text-xs text-success/70 mt-1">Achieved</div>
        </div>

        <div className="bg-gradient-to-br from-info/10 to-info/5 rounded-2xl p-4 border border-info/20 hover:border-info/30 transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-info" />
            <span className="text-xs text-muted-foreground font-medium">
              This Month
            </span>
          </div>
          <div className="text-2xl font-bold text-info">
            {objectives.thisMonth}
          </div>
          <div className="text-xs text-info/70 mt-1">Targeted</div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="space-y-4">
        {/* Overall Progress */}
        <div className="bg-background/60 rounded-2xl p-4 border border-border/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">
              Overall Progress
            </span>
            <div
              className={`px-2 py-1 rounded-full text-xs font-medium ${progressStatus.bgColor} ${progressStatus.color}`}
            >
              {progressStatus.text}
            </div>
          </div>

          <div className="w-full bg-muted/30 rounded-full h-3 mb-2">
            <div
              className="bg-gradient-to-r from-accent via-info to-success h-3 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
              style={{ width: `${completionRate}%` }}
            >
              {/* Animated shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {objectives.completed} of {objectives.total} objectives
            </span>
            <span className="text-sm font-bold text-accent">
              {completionRate}%
            </span>
          </div>
        </div>

        {/* This Month Focus */}
        {objectives.thisMonth > 0 && (
          <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl p-4 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Monthly Focus
              </span>
            </div>

            <div className="w-full bg-muted/20 rounded-full h-2 mb-2">
              <div
                className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(thisMonthProgress, 100)}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                Monthly objectives progress
              </span>
              <span className="text-xs font-medium text-primary">
                {thisMonthProgress}%
              </span>
            </div>
          </div>
        )}

        {/* Quick Insights */}
        <div className="flex items-start gap-3 p-3 bg-background/40 rounded-xl border border-border/20">
          <div className="w-6 h-6 bg-gradient-to-br from-warning/20 to-warning/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-3 h-3 text-warning" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-foreground mb-1">
              Quick Insight
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {objectives.total === 0
                ? '🚀 Ready to set your first objective? Start with a clear, measurable goal.'
                : objectives.active === 0
                ? '🎯 All objectives completed! Time to set new challenges.'
                : objectives.active > 3
                ? '⚡ You have many active objectives. Consider focusing on top priorities.'
                : completionRate >= 80
                ? "🏆 Excellent progress! You're crushing your objectives."
                : completionRate >= 50
                ? '📈 Good momentum! Keep pushing toward your goals.'
                : '💪 Focus on completing current objectives before adding new ones.'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions Footer */}
      {objectives.total === 0 && (
        <div className="mt-4 pt-4 border-t border-border/30">
          <Link to="/dashboard/objectives">
            <Button variant="gradient" size="sm" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Objective
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default ObjectivesOverview;
