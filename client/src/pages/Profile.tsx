import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import Container from '../components/ui/Container';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import MessageDisplay from '../components/ui/MessageDisplay';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileTabs from '../components/profile/ProfileTabs';
import ProfileSidebar from '../components/profile/ProfileSidebar';
import PersonalInfoTab from '../components/profile/PersonalInfoTab';
import AccountSettingsTab from '../components/profile/AccountSettingsTab';
import WorkPreferencesTab from '../components/profile/WorkPreferencesTab';
import EnergyLevelsTab from '../components/profile/EnergyLevelsTab';
import AnalyticsTab from '../components/profile/AnalyticsTab';
import {
  getUserProfile,
  updateUserProfile,
  getUserStatistics,
} from '../utils/api';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  timezone: string;
  preferences: {
    workingHours: {
      start: string;
      end: string;
    };
    preferredTaskDuration: number;
    energyLevels: {
      morning: string;
      afternoon: string;
      evening: string;
    };
  };
}

export interface UserStats {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  monthlyObjectives: number;
  monthlyTasks: number;
  taskCompletionRate: number;
  tasksCompleted: number;
  totalTasks: number;
}

export interface FormData {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  timezone: string;
  workingHours: {
    start: string;
    end: string;
  };
  preferredTaskDuration: number;
  energyLevels: {
    morning: string;
    afternoon: string;
    evening: string;
  };
}

export interface FormErrors {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  timezone?: string;
  workingHours?: string;
  preferredTaskDuration?: string;
  energyLevels?: string;
  general?: string;
}

// Enhanced Tab Navigation
const tabs = [
  { id: 'personal', label: 'Personal Info', icon: '👤' },
  { id: 'account', label: 'Account Settings', icon: '⚙️' },
  { id: 'preferences', label: 'Work Preferences', icon: '🎯' },
  { id: 'energy', label: 'Energy Levels', icon: '⚡' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
];

// Enhanced Main Content with Tabs
const Profile = () => {
  const { user, updateUser } = useAuth();
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('personal');

  // Form data state
  const [formData, setFormData] = useState<FormData>({
    email: '',
    username: '',
    firstName: '',
    lastName: '',
    timezone: '',
    workingHours: {
      start: '',
      end: '',
    },
    preferredTaskDuration: 30,
    energyLevels: {
      morning: '',
      afternoon: '',
      evening: '',
    },
  });

  // Load user profile and stats on component mount
  useEffect(() => {
    Promise.all([loadUserProfile(), loadUserStatistics()]);
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      const response = await getUserProfile();

      if (response.success && response.data?.user) {
        const userData = response.data.user;
        setProfileData(userData);

        // Populate form data
        setFormData({
          email: userData.email || '',
          username: userData.username || '',
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          timezone: userData.timezone || '',
          workingHours: {
            start: userData.preferences?.workingHours?.start || '09:00',
            end: userData.preferences?.workingHours?.end || '17:00',
          },
          preferredTaskDuration:
            userData.preferences?.preferredTaskDuration || 30,
          energyLevels: {
            morning: userData.preferences?.energyLevels?.morning || 'medium',
            afternoon:
              userData.preferences?.energyLevels?.afternoon || 'medium',
            evening: userData.preferences?.energyLevels?.evening || 'medium',
          },
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserStatistics = async () => {
    try {
      setStatsLoading(true);
      const response = await getUserStatistics();

      if (response.success && response.data?.stats) {
        setUserStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error loading user statistics:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...prev,
          [parent]: {
            ...(prev[parent as keyof typeof prev] as any),
            [child]: value,
          },
        };
      }
      return {
        ...prev,
        [field]: value,
      };
    });

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }

    // Clear success message
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Username validation
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (!usernameRegex.test(formData.username)) {
      newErrors.username =
        'Username must be 3-20 characters (letters, numbers, underscore only)';
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.timezone.trim()) {
      newErrors.timezone = 'Timezone is required';
    }

    if (
      formData.preferredTaskDuration < 5 ||
      formData.preferredTaskDuration > 240
    ) {
      newErrors.preferredTaskDuration =
        'Duration must be between 5 and 240 minutes';
    }

    const startTime = new Date(`2000-01-01T${formData.workingHours.start}`);
    const endTime = new Date(`2000-01-01T${formData.workingHours.end}`);

    if (startTime >= endTime) {
      newErrors.workingHours = 'End time must be after start time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      setErrors({});

      const updateData = {
        email: formData.email,
        username: formData.username,
        firstName: formData.firstName,
        lastName: formData.lastName,
        timezone: formData.timezone,
        preferences: {
          workingHours: formData.workingHours,
          preferredTaskDuration: formData.preferredTaskDuration,
          energyLevels: formData.energyLevels,
        },
      };

      const response = await updateUserProfile(updateData);

      if (response.success) {
        updateUser(updateData);
        setSuccessMessage('Profile updated successfully!');
        await Promise.all([loadUserProfile(), loadUserStatistics()]);
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setErrors({
        general: error.error || 'Failed to update profile. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Dubai',
    'Australia/Sydney',
    'Pacific/Auckland',
  ];

  const energyLevels = [
    {
      value: 'low',
      label: 'Low',
      emoji: '😴',
      description: 'Basic tasks only',
    },
    {
      value: 'medium',
      label: 'Medium',
      emoji: '😊',
      description: 'Regular productivity',
    },
    {
      value: 'high',
      label: 'High',
      emoji: '⚡',
      description: 'Peak performance',
    },
  ];

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: '👤' },
    { id: 'account', label: 'Account', icon: '⚙️' },
    { id: 'preferences', label: 'Work Preferences', icon: '🎯' },
    { id: 'energy', label: 'Energy Levels', icon: '⚡' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
  ];

  if (isLoading) {
    return <LoadingSpinner message="loading profile..." />;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return (
          <PersonalInfoTab
            formData={formData}
            errors={errors}
            timezones={timezones}
            onInputChange={handleInputChange}
          />
        );
      case 'account':
        return (
          <AccountSettingsTab
            formData={formData}
            errors={errors}
            profileData={profileData}
            onInputChange={handleInputChange}
          />
        );
      case 'preferences':
        return (
          <WorkPreferencesTab
            formData={formData}
            errors={errors}
            onInputChange={handleInputChange}
          />
        );
      case 'energy':
        return (
          <EnergyLevelsTab
            formData={formData}
            energyLevels={energyLevels}
            onInputChange={handleInputChange}
          />
        );
      case 'analytics':
        return (
          <AnalyticsTab
            userStats={userStats}
            statsLoading={statsLoading}
            onRefreshAnalytics={loadUserStatistics}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      <Container className="py-8">
        <ProfileHeader
          profileData={profileData}
          user={user}
          userStats={userStats}
          statsLoading={statsLoading}
          formData={formData}
        />

        {successMessage && (
          <MessageDisplay message={successMessage} type="success" />
        )}

        {errors.general && (
          <MessageDisplay message={errors.general} type="error" />
        )}

        <ProfileTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          <div className="xl:col-span-3">{renderTabContent()}</div>

          <ProfileSidebar
            userStats={userStats}
            statsLoading={statsLoading}
            isSaving={isSaving}
            onSave={handleSave}
          />
        </div>
      </Container>
    </div>
  );
};

export default Profile;
