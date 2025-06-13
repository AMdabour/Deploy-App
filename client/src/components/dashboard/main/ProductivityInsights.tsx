import React, { useMemo } from 'react';
import {
  TrendingUp,
  Zap,
  Target,
  Clock,
  Brain,
  CheckSquare,
  Calendar,
} from 'lucide-react';

interface ProductivityInsightsProps {
  insights: any[];
}

const ProductivityInsights: React.FC<ProductivityInsightsProps> = ({
  insights,
}) => {
  // Memoize fallback insights generation
  const fallbackInsights = useMemo(() => {
    const currentHour = new Date().getHours();
    let timeInsight = 'Peak Performance Time';
    let timeDescription = 'Morning hours are typically most productive';

    if (currentHour >= 6 && currentHour < 10) {
      timeDescription = "You're in your morning productivity zone!";
    } else if (currentHour >= 14 && currentHour < 17) {
      timeDescription = 'Afternoon focus session - great time for deep work';
    } else if (currentHour >= 20) {
      timeDescription = 'Evening work detected - consider morning planning';
    }

    return [
      {
        type: 'time_management',
        title: timeInsight,
        description: timeDescription,
        actionable_tips: [
          'Schedule important tasks during peak hours',
          'Take breaks every 90 minutes',
        ],
        confidence: 0.7,
        icon: Clock,
        color: 'from-info to-cyan-500',
      },
      {
        type: 'task_completion',
        title: 'Task Management',
        description: 'Breaking down large tasks improves completion rates',
        actionable_tips: [
          'Use the 2-minute rule for quick tasks',
          'Set realistic daily goals',
        ],
        confidence: 0.8,
        icon: CheckSquare,
        color: 'from-success to-emerald-500',
      },
      {
        type: 'planning_strategy',
        title: 'Weekly Planning',
        description: 'Regular planning sessions boost productivity',
        actionable_tips: [
          'Review goals weekly',
          'Plan tomorrow before leaving work',
        ],
        confidence: 0.75,
        icon: Calendar,
        color: 'from-accent to-purple-500',
      },
    ];
  }, []);

  // Memoize insight configuration
  const getInsightConfig = (type: string) => {
    const configs = {
      task_completion_pattern: {
        icon: CheckSquare,
        color: 'from-success to-emerald-500',
      },
      time_management: { icon: Clock, color: 'from-info to-cyan-500' },
      priority_focus: { icon: Target, color: 'from-warning to-amber-500' },
      goal_alignment: { icon: Target, color: 'from-primary to-blue-500' },
      scheduling_habits: { icon: Calendar, color: 'from-accent to-purple-500' },
      energy_optimization: { icon: Zap, color: 'from-warning to-amber-500' },
      productivity_boost: { icon: TrendingUp, color: 'from-success to-emerald-500' },
      efficiency_boost: { icon: Target, color: 'from-accent to-purple-500' },
      workflow_optimization: {
        icon: Brain,
        color: 'from-accent to-purple-500',
      },
      default: { icon: TrendingUp, color: 'from-primary to-blue-500' },
    };

    return configs[type as keyof typeof configs] || configs.default;
  };

  // Use AI insights if available and valid, otherwise use fallback
  const displayInsights = useMemo(() => {
    // Validate insights data
    if (!insights || !Array.isArray(insights) || insights.length === 0) {
      console.log('ProductivityInsights: Using fallback insights');
      return fallbackInsights;
    }

    // Validate each insight has required properties
    const validInsights = insights.filter(
      (insight) =>
        insight &&
        typeof insight === 'object' &&
        insight.title &&
        insight.description &&
        Array.isArray(insight.actionable_tips)
    );

    if (validInsights.length === 0) {
      console.log('ProductivityInsights: No valid insights, using fallback');
      return fallbackInsights;
    }

    console.log('ProductivityInsights: Using AI insights:', validInsights.length);
    return validInsights;
  }, [insights, fallbackInsights]);

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-accent/20 rounded-2xl flex items-center justify-center">
          <Brain className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Productivity Insights</h3>
          <p className="text-sm text-muted-foreground">
            AI-powered recommendations
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {displayInsights.slice(0, 3).map((insight, index) => {
          const config = getInsightConfig(insight.type || 'default');
          const IconComponent = config.icon;

          return (
            <div
              key={index}
              className="group p-4 bg-gradient-to-r from-background/50 to-muted/20 rounded-xl border border-border/30 hover:border-border/60 transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${config.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-200`}
                >
                  <IconComponent className="w-6 h-6 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-foreground text-sm">
                      {insight.title}
                    </h4>
                    {insight.confidence && (
                      <span className="text-xs px-2 py-1 bg-accent/20 text-accent rounded-full">
                        {Math.round((insight.confidence || 0) * 100)}%
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                    {insight.description}
                  </p>

                  {insight.actionable_tips &&
                    insight.actionable_tips.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-foreground">
                          Quick Tips:
                        </p>
                        <ul className="space-y-1">
                          {insight.actionable_tips
                            .slice(0, 2)
                            .map((tip: string, tipIndex: number) => (
                              <li
                                key={tipIndex}
                                className="text-xs text-muted-foreground flex items-start gap-2"
                              >
                                <span className="text-accent">•</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note about insights */}
      <div className="mt-6 pt-4 border-t border-border/30">
        <p className="text-xs text-muted-foreground text-center">
          {insights && insights.length > 0
            ? '🤖 Insights generated by AI based on your activity patterns'
            : '💡 General productivity tips - AI insights will appear as you use the app'}
        </p>
      </div>
    </div>
  );
};

export default ProductivityInsights;
