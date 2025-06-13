import React from 'react';
import {
  Plus,
  Calendar,
  Target,
  CheckSquare,
  Zap,
  Lightbulb,
} from 'lucide-react';
import { Link } from 'react-router';

const QuickActions: React.FC = () => {
  const actions = [
    {
      label: 'New Task',
      icon: Plus,
      path: '/dashboard/tasks',
      color: 'from-info to-cyan-500',
      description: 'Add a task',
    },
    {
      label: 'New Goal',
      icon: Target,
      path: '/dashboard/goals',
      color: 'from-primary to-blue-500',
      description: 'Set a goal',
    },
    {
      label: 'New Objective',
      icon: Lightbulb,
      path: '/dashboard/objectives',
      color: 'from-accent to-purple-500',
      description: 'Create objective',
    },
  ];

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-3xl p-6 hover:shadow-2xl transition-all duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">Quick Actions</h3>
          <p className="text-sm text-muted-foreground">Get things done</p>
        </div>
      </div>

      <div className="space-y-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              to={action.path}
              className="w-full group bg-background/60 border border-border/30 rounded-xl p-4 hover:shadow-lg transition-all duration-300 text-left hover:scale-[1.02] hover:bg-background/80 block animate-in slide-in-from-left"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {action.label}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {action.description}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
