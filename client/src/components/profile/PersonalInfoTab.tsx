import React from 'react';
import Input from '../ui/Input';
import { FormData, FormErrors } from '../../pages/Profile';

interface PersonalInfoTabProps {
  formData: FormData;
  errors: FormErrors;
  timezones: string[];
  onInputChange: (field: string, value: any) => void;
}

const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({
  formData,
  errors,
  timezones,
  onInputChange,
}) => (
  <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-8 shadow-xl animate-in fade-in duration-300">
    <div className="flex items-center space-x-3 mb-8">
      <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-xl flex items-center justify-center">
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
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Personal Information
        </h2>
        <p className="text-muted-foreground">Update your personal details</p>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Input
        label="First Name"
        placeholder="Enter your first name"
        value={formData.firstName}
        onChange={(e) => onInputChange('firstName', e.target.value)}
        error={errors.firstName}
        size="md"
        className="transition-all duration-200 focus:scale-[1.02]"
      />

      <Input
        label="Last Name"
        placeholder="Enter your last name"
        value={formData.lastName}
        onChange={(e) => onInputChange('lastName', e.target.value)}
        error={errors.lastName}
        size="md"
        className="transition-all duration-200 focus:scale-[1.02]"
      />

      <div className="md:col-span-2 space-y-2">
        <label className="block text-sm font-medium text-foreground">
          Timezone
        </label>
        <select
          value={formData.timezone}
          onChange={(e) => onInputChange('timezone', e.target.value)}
          className="w-full px-4 py-3 bg-input border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 focus:scale-[1.01]"
        >
          <option value="">Select your timezone</option>
          {timezones.map((tz) => (
            <option key={tz} value={tz}>
              {tz.replace('_', ' ')}
            </option>
          ))}
        </select>
        {errors.timezone && (
          <p className="text-sm text-destructive mt-1 animate-in slide-in-from-left duration-200">
            {errors.timezone}
          </p>
        )}
      </div>
    </div>
  </div>
);

export default PersonalInfoTab;
