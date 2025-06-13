import React from 'react';
import { FormData, FormErrors } from '../../pages/Profile';

interface WorkPreferencesTabProps {
  formData: FormData;
  errors: FormErrors;
  onInputChange: (field: string, value: any) => void;
}

const WorkPreferencesTab: React.FC<WorkPreferencesTabProps> = ({
  formData,
  errors,
  onInputChange,
}) => (
  <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-8 shadow-xl animate-in fade-in duration-300">
    <div className="flex items-center space-x-3 mb-8">
      <div className="w-12 h-12 bg-gradient-to-r from-success to-primary rounded-xl flex items-center justify-center">
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-foreground">Work Preferences</h2>
        <p className="text-muted-foreground">
          Configure your work schedule and task preferences
        </p>
      </div>
    </div>

    <div className="space-y-8">
      {/* Working Hours */}
      <div className="p-6 bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl border border-primary/10">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <span className="mr-2">🕐</span>
          Working Hours
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Start Time
            </label>
            <input
              type="time"
              value={formData.workingHours.start}
              onChange={(e) =>
                onInputChange('workingHours.start', e.target.value)
              }
              className="w-full px-4 py-3 bg-input border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 focus:scale-[1.02]"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              End Time
            </label>
            <input
              type="time"
              value={formData.workingHours.end}
              onChange={(e) =>
                onInputChange('workingHours.end', e.target.value)
              }
              className="w-full px-4 py-3 bg-input border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 focus:scale-[1.02]"
            />
          </div>
        </div>
        {errors.workingHours && (
          <p className="text-sm text-destructive mt-2 animate-in slide-in-from-left duration-200">
            {errors.workingHours}
          </p>
        )}
      </div>

      {/* Task Duration */}
      <div className="p-6 bg-gradient-to-r from-accent/5 to-success/5 rounded-xl border border-accent/10">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <span className="mr-2">⏱️</span>
          Preferred Task Duration
        </h3>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Set your default duration for new tasks (5-240 minutes)
          </p>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="5"
              max="240"
              step="5"
              value={formData.preferredTaskDuration}
              onChange={(e) =>
                onInputChange('preferredTaskDuration', parseInt(e.target.value))
              }
              className="flex-1 h-3 bg-muted rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex items-center space-x-2 min-w-[140px] bg-background rounded-lg border border-border p-2">
              <input
                type="number"
                min="5"
                max="240"
                value={formData.preferredTaskDuration}
                onChange={(e) =>
                  onInputChange(
                    'preferredTaskDuration',
                    parseInt(e.target.value) || 30
                  )
                }
                className="w-16 px-2 py-1 bg-transparent text-foreground text-center focus:outline-none"
              />
              <span className="text-sm text-muted-foreground">minutes</span>
            </div>
          </div>
          {errors.preferredTaskDuration && (
            <p className="text-sm text-destructive animate-in slide-in-from-left duration-200">
              {errors.preferredTaskDuration}
            </p>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default WorkPreferencesTab;
