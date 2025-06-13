import React from 'react';
import Input from '../ui/Input';
import { FormData, FormErrors, UserProfile } from '../../pages/Profile';
import MessageDisplay from '../ui/MessageDisplay';

interface AccountSettingsTabProps {
  formData: FormData;
  errors: FormErrors;
  profileData: UserProfile | null;
  onInputChange: (field: string, value: any) => void;
}

const AccountSettingsTab: React.FC<AccountSettingsTabProps> = ({
  formData,
  errors,
  profileData,
  onInputChange,
}) => (
  <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-8 shadow-xl animate-in fade-in duration-300">
    <div className="flex items-center space-x-3 mb-8">
      <div className="w-12 h-12 bg-gradient-to-r from-accent to-success rounded-xl flex items-center justify-center">
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
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-foreground">Account Settings</h2>
        <p className="text-muted-foreground">Manage your account credentials</p>
      </div>
    </div>

    <div className="space-y-6">
      <MessageDisplay
        type="info"
        message="Update your email address and username. Your user ID is unique and cannot be changed."
      />

      <Input
        label="Email Address"
        type="email"
        placeholder="Enter your email address"
        value={formData.email}
        onChange={(e) => onInputChange('email', e.target.value)}
        error={errors.email}
        size="md"
        className="transition-all duration-200 focus:scale-[1.02]"
      />

      <Input
        label="Username"
        placeholder="Enter your username"
        value={formData.username}
        onChange={(e) => onInputChange('username', e.target.value)}
        error={errors.username}
        size="md"
        className="transition-all duration-200 focus:scale-[1.02]"
        helperText="3-20 characters (letters, numbers, underscore only)"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/20 rounded-xl">
        <div className="flex flex-col space-y-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            User ID
          </span>
          <span className="text-sm text-foreground font-mono bg-background px-3 py-2 rounded-lg">
            {profileData?.id}
          </span>
        </div>
      </div>
    </div>
  </div>
);

export default AccountSettingsTab;
