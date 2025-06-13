import React from 'react';
import {
  CheckSquare,
  Target,
  TrendingUp,
  Clock,
  AlertTriangle,
  Sparkles,
  Calendar,
  BarChart3,
} from 'lucide-react';

interface StatsGridProps {
  stats: {
    tasks: {
      total: number;
      completed: number;
      pending: number;
      overdue: number;
      completionRate: number;
      todayTasks: number;
    };
    goals: {
      total: number;
      active: number;
      completed: number;
      aiEnhanced: number;
    };
    objectives: {
      total: number;
      active: number;
      thisMonth: number;
    };
    productivity: {
      score: number;
    };
  };
}

const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
  const statCards = [
    {
      title: 'Tasks Completed',
      value: stats.tasks.completed,
      total: stats.tasks.total,
      icon: CheckSquare,
      color: 'from-success to-emerald-500',
      bgColor: 'bg-success/10',
      textColor: 'text-success',
      description: `${Math.round(
        stats.tasks.completionRate || 0
      )}% completion rate`,
    },
    {
      title: 'Active Goals',
      value: stats.goals.active,
      total: stats.goals.total,
      icon: Target,
      color: 'from-primary to-blue-500',
      bgColor: 'bg-primary/10',
      textColor: 'text-primary',
      description: `${stats.goals.aiEnhanced} AI enhanced`,
    },
    {
      title: 'This Month',
      value: stats.objectives.thisMonth,
      total: stats.objectives.total,
      icon: Calendar,
      color: 'from-info to-cyan-500',
      bgColor: 'bg-info/10',
      textColor: 'text-info',
      description: 'Objectives in focus',
    },
    {
      title: 'Productivity',
      value: Math.round(stats.productivity.score),
      total: 100,
      icon: TrendingUp,
      color: 'from-accent to-purple-500',
      bgColor: 'bg-accent/10',
      textColor: 'text-accent',
      description: 'Overall performance',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((card, index) => {
        const Icon = card.icon;
        const percentage = card.total > 0 ? (card.value / card.total) * 100 : 0;

        return (
          <div
            key={card.title}
            className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 group animate-in slide-in-from-bottom"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-12 h-12 ${card.bgColor} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}
              >
                <Icon className={`w-6 h-6 ${card.textColor}`} />
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${card.textColor}`}>
                  {card.value}
                  {card.total > 0 && card.total !== 100 && (
                    <span className="text-sm text-muted-foreground ml-1">
                      /{card.total}
                    </span>
                  )}
                  {card.total === 100 && <span className="text-sm">%</span>}
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  {card.title}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${card.color} rounded-full transition-all duration-500`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsGrid;
