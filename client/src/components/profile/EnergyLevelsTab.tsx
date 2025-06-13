import React from 'react';
import { FormData } from '../../pages/Profile';

interface EnergyLevelsTabProps {
  formData: FormData;
  energyLevels: Array<{
    value: string;
    label: string;
    emoji: string;
    description: string;
  }>;
  onInputChange: (field: string, value: any) => void;
}

const EnergyLevelsTab: React.FC<EnergyLevelsTabProps> = ({
  formData,
  energyLevels,
  onInputChange,
}) => (
  <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-8 shadow-xl animate-in fade-in duration-300">
    <div className="flex items-center space-x-3 mb-8">
      <div className="w-12 h-12 bg-gradient-to-r from-warning to-success rounded-xl flex items-center justify-center">
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
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-foreground">Energy Levels</h2>
        <p className="text-muted-foreground">
          Help us schedule tasks when you're most productive
        </p>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {Object.entries(formData.energyLevels).map(([period, level]) => (
        <div key={period} className="space-y-4">
          <div className="text-center">
            <div className="text-4xl mb-2">
              {period === 'morning' && '🌅'}
              {period === 'afternoon' && '☀️'}
              {period === 'evening' && '🌙'}
            </div>
            <h3 className="text-lg font-semibold text-foreground capitalize">
              {period}
            </h3>
            <p className="text-sm text-muted-foreground">
              {period === 'morning' && '6 AM - 12 PM'}
              {period === 'afternoon' && '12 PM - 6 PM'}
              {period === 'evening' && '6 PM - 12 AM'}
            </p>
          </div>
          <div className="space-y-3">
            {energyLevels.map((energyLevel) => (
              <label
                key={energyLevel.value}
                className={`group flex items-center p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-md ${
                  level === energyLevel.value
                    ? 'border-primary bg-primary/10 text-primary shadow-lg scale-105'
                    : 'border-border bg-input hover:border-primary/30 hover:bg-background'
                }`}
              >
                <input
                  type="radio"
                  name={`energy-${period}`}
                  value={energyLevel.value}
                  checked={level === energyLevel.value}
                  onChange={(e) =>
                    onInputChange(`energyLevels.${period}`, e.target.value)
                  }
                  className="sr-only"
                />
                <span className="mr-3 text-2xl group-hover:scale-110 transition-transform">
                  {energyLevel.emoji}
                </span>
                <div className="flex-1">
                  <div className="font-medium">{energyLevel.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {energyLevel.description}
                  </div>
                </div>
                {level === energyLevel.value && (
                  <svg
                    className="w-5 h-5 text-primary"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default EnergyLevelsTab;
