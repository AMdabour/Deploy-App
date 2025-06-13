import React, { useState } from 'react';
import { Brain, Lightbulb, TrendingUp, Target, Zap } from 'lucide-react';
import Button from '@/components/ui/Button';

interface AISuggestionsProps {
  suggestions: any[];
}

const AISuggestions: React.FC<AISuggestionsProps> = ({ suggestions = [] }) => {
  const [dismissedSuggestions, setDismissedSuggestions] = useState<string[]>([]);

  // Defensive: extract suggestions array if wrapped in a data object
  let safeSuggestions: any[] = [];
  if (Array.isArray(suggestions)) {
    safeSuggestions = suggestions;
  } else if (suggestions && Array.isArray((suggestions as any).data?.suggestions)) {
    safeSuggestions = (suggestions as any).data.suggestions;
  } else if (Array.isArray((suggestions as any)?.suggestions)) {
    safeSuggestions = (suggestions as any).suggestions;
  }

  const generateFallbackSuggestions = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const hour = today.getHours();

    const suggestions = [
      {
        id: 'plan-week',
        title: 'Plan Your Week',
        description:
          'Take 15 minutes to plan your upcoming week for better productivity.',
        type: 'planning',
        priority: 'medium',
        icon: Target,
        color: 'from-primary to-blue-500',
      },
      {
        id: 'break-reminder',
        title: 'Take a Break',
        description: 'Regular breaks improve focus and prevent burnout.',
        type: 'wellness',
        priority: 'low',
        icon: TrendingUp,
        color: 'from-success to-emerald-500',
      },
      {
        id: 'goal-review',
        title: 'Review Your Goals',
        description: 'Check progress on your goals and adjust if needed.',
        type: 'goals',
        priority: 'medium',
        icon: Target,
        color: 'from-accent to-purple-500',
      },
      {
        id: 'energy-optimization',
        title: 'Optimize Your Energy',
        description: 'Schedule demanding tasks during your peak energy hours.',
        type: 'productivity',
        priority: 'high',
        icon: Zap,
        color: 'from-warning to-orange-500',
      },
    ];

    // Contextual suggestions based on time
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Weekend
      suggestions.unshift({
        id: 'weekend-planning',
        title: 'Weekend Planning',
        description: 'Use this time to plan and prepare for the upcoming week.',
        type: 'planning',
        priority: 'medium',
        icon: Target,
        color: 'from-info to-cyan-500',
      });
    }

    if (hour < 10) {
      // Morning
      suggestions.unshift({
        id: 'morning-priorities',
        title: 'Set Morning Priorities',
        description: 'Tackle your most important tasks while energy is high.',
        type: 'productivity',
        priority: 'high',
        icon: Zap,
        color: 'from-warning to-orange-500',
      });
    }

    return suggestions;
  };

  const handleApplySuggestion = (suggestionId: string) => {
    // TODO: Implement apply suggestion logic
    console.log('Apply suggestion:', suggestionId);
    setDismissedSuggestions((prev) => [...prev, suggestionId]);
  };

  const handleDismissSuggestion = (suggestionId: string) => {
    setDismissedSuggestions((prev) => [...prev, suggestionId]);
  };

  // Use AI suggestions if available, otherwise use fallback
  const allSuggestions =
    suggestions && suggestions.length > 0
      ? suggestions
      : generateFallbackSuggestions();

  // Filter out dismissed suggestions
  const displaySuggestions = allSuggestions.filter(
    (suggestion) => !dismissedSuggestions.includes(suggestion.id)
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-destructive';
      case 'medium':
        return 'text-warning';
      case 'low':
        return 'text-success';
      default:
        return 'text-muted-foreground';
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'productivity':
        return TrendingUp;
      case 'goal':
        return Target;
      case 'insight':
        return Lightbulb;
      default:
        return Zap;
    }
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'productivity':
        return 'from-success to-emerald-500';
      case 'goal':
        return 'from-primary to-blue-500';
      case 'insight':
        return 'from-accent to-purple-500';
      default:
        return 'from-info to-cyan-500';
    }
  };

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-3xl p-6 hover:shadow-2xl transition-all duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-accent to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">AI Suggestions</h3>
          <p className="text-sm text-muted-foreground">Smart insights</p>
        </div>
      </div>

      <div className="space-y-4">
        {safeSuggestions.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">
              No AI suggestions yet
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              Complete more tasks to get personalized insights
            </p>
          </div>
        ) : (
          safeSuggestions.slice(0, 3).map((suggestion, index) => {
            const IconComponent = getSuggestionIcon(suggestion.type);
            const colorClass = getSuggestionColor(suggestion.type);

            return (
              <div
                key={suggestion.id || index}
                className="flex items-start gap-3 p-4 bg-background/60 rounded-xl border border-border/30 hover:bg-background/80 transition-all duration-200"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className={`w-8 h-8 bg-gradient-to-r ${colorClass} rounded-lg flex items-center justify-center flex-shrink-0`}
                >
                  <IconComponent className="w-4 h-4 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground text-sm mb-2">
                    {suggestion.title || 'AI Suggestion'}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {suggestion.description ||
                      suggestion.content ||
                      'No description available'}
                  </p>

                  {suggestion.confidence && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Confidence</span>
                        <span>{Math.round(suggestion.confidence * 100)}%</span>
                      </div>
                      <div className="w-full bg-muted/30 rounded-full h-1">
                        <div
                          className={`bg-gradient-to-r ${colorClass} h-1 rounded-full transition-all duration-500`}
                          style={{ width: `${suggestion.confidence * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {safeSuggestions.length > 3 && (
        <div className="mt-4 pt-4 border-t border-border/30">
          <p className="text-xs text-muted-foreground text-center">
            {safeSuggestions.length - 3} more suggestions available
          </p>
        </div>
      )}
    </div>
  );
};

export default AISuggestions;
