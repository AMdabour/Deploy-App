import React from 'react';

interface Tab {
  id: string;
  label: string;
  icon: string;
}

interface ProfileTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
}) => (
  <div className="mb-8">
    <div className="flex flex-wrap gap-2 p-2 bg-muted/30 rounded-2xl backdrop-blur-sm border border-border/30">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 cursor-pointer ${
            activeTab === tab.id
              ? 'bg-background text-primary shadow-lg border border-primary/20 scale-105'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
          }`}
        >
          <span className="text-lg">{tab.icon}</span>
          <span className="hidden md:inline">{tab.label}</span>
        </button>
      ))}
    </div>
  </div>
);

export default ProfileTabs;
