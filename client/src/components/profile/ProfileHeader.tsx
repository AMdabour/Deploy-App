import { UserProfile, UserStats, FormData } from '../../pages/Profile';
import { Link } from 'react-router';

interface ProfileHeaderProps {
  profileData: UserProfile | null;
  user: any;
  userStats: UserStats | null;
  statsLoading: boolean;
  formData: FormData;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profileData,
  user,
  userStats,
  statsLoading,
  formData,
}) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-accent/10 to-success/10 rounded-3xl p-8 mb-8 border border-border/50">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent"></div>

      {/* Back to Dashboard Button */}
      <div className="relative z-10 mb-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-background/80 backdrop-blur-sm border border-border/50 rounded-xl text-muted-foreground hover:text-foreground hover:bg-background/90 transition-all duration-200 hover:scale-105"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span className="text-sm font-medium">Back to Dashboard</span>
        </Link>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
        <div className="relative group">
          <div className="w-32 h-32 bg-gradient-to-br from-primary via-accent to-success rounded-full flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform duration-300">
            <span className="text-5xl font-bold text-white">
              {profileData?.firstName?.[0]?.toUpperCase() ||
                user?.firstName?.[0]?.toUpperCase() ||
                'U'}
            </span>
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-success rounded-full border-4 border-background flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
        </div>

        <div className="text-center md:text-left flex-1">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {profileData?.firstName && profileData?.lastName
              ? `${profileData.firstName} ${profileData.lastName}`
              : `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
                'User'}
          </h1>
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-2 md:space-y-0 md:space-x-6">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              <span>{profileData?.email || user?.email}</span>
            </div>
            <div className="flex items-center space-x-2 text-muted-foreground">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                  clipRule="evenodd"
                />
              </svg>
              <span>@{profileData?.username || user?.username}</span>
            </div>
          </div>
          <div className="mt-4 inline-flex items-center px-4 py-2 bg-background/80 backdrop-blur-sm rounded-full border border-border/50">
            <div className="w-2 h-2 bg-success rounded-full mr-2 animate-pulse"></div>
            <span className="text-sm text-muted-foreground">
              Profile Active
            </span>
          </div>
        </div>

        {/* Enhanced Statistics Display */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsLoading ? (
            // Loading skeletons
            [...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-background/60 backdrop-blur-sm rounded-xl p-4 border border-border/30 animate-pulse"
              >
                <div className="h-6 bg-muted/30 rounded mb-2"></div>
                <div className="h-4 bg-muted/20 rounded w-16"></div>
              </div>
            ))
          ) : userStats ? (
            <>
              <div className="bg-background/60 backdrop-blur-sm rounded-xl p-4 border border-border/30 hover:bg-background/80 transition-colors">
                <div className="text-2xl font-bold text-primary">
                  {userStats.totalGoals}
                </div>
                <div className="text-xs text-muted-foreground">Total Goals</div>
              </div>
              <div className="bg-background/60 backdrop-blur-sm rounded-xl p-4 border border-border/30 hover:bg-background/80 transition-colors">
                <div className="text-2xl font-bold text-success">
                  {userStats.activeGoals}
                </div>
                <div className="text-xs text-muted-foreground">
                  Active Goals
                </div>
              </div>
              <div className="bg-background/60 backdrop-blur-sm rounded-xl p-4 border border-border/30 hover:bg-background/80 transition-colors">
                <div className="text-2xl font-bold text-accent">
                  {userStats.monthlyTasks}
                </div>
                <div className="text-xs text-muted-foreground">
                  Monthly Tasks
                </div>
              </div>
              <div className="bg-background/60 backdrop-blur-sm rounded-xl p-4 border border-border/30 hover:bg-background/80 transition-colors">
                <div className="text-2xl font-bold text-warning">
                  {userStats.taskCompletionRate.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  Completion Rate
                </div>
              </div>
            </>
          ) : (
            // Fallback to original display
            <>
              <div className="bg-background/60 backdrop-blur-sm rounded-xl p-4 border border-border/30">
                <div className="text-2xl font-bold text-primary">
                  {Math.floor(
                    (new Date().getTime() -
                      new Date(Date.now() - 86400000 * 30).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}
                </div>
                <div className="text-xs text-muted-foreground">Days Active</div>
              </div>
              <div className="bg-background/60 backdrop-blur-sm rounded-xl p-4 border border-border/30">
                <div className="text-2xl font-bold text-accent">
                  {profileData?.preferences?.preferredTaskDuration ||
                    formData.preferredTaskDuration}
                </div>
                <div className="text-xs text-muted-foreground">
                  Task Duration
                </div>
              </div>
              <div className="bg-background/60 backdrop-blur-sm rounded-xl p-4 border border-border/30">
                <div className="text-2xl font-bold text-success">
                  {Math.abs(
                    new Date(
                      `2000-01-01T${
                        profileData?.preferences?.workingHours?.end ||
                        formData.workingHours.end
                      }`
                    ).getTime() -
                      new Date(
                        `2000-01-01T${
                          profileData?.preferences?.workingHours?.start ||
                          formData.workingHours.start
                        }`
                      ).getTime()
                  ) /
                    (1000 * 60 * 60)}
                  h
                </div>
                <div className="text-xs text-muted-foreground">Work Hours</div>
              </div>
              <div className="bg-background/60 backdrop-blur-sm rounded-xl p-4 border border-border/30">
                <div className="text-2xl font-bold text-info">0</div>
                <div className="text-xs text-muted-foreground">
                  Stats Loading...
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
