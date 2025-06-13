import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { Activity, Plus, Coffee, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router';
import {
  getUserStatistics,
  getTaskCompletionStatistics,
  getAllTasks,
  getAllGoals,
  getAllObjectives,
  getActiveSuggestions,
  getProductivityInsightsFromAI,
  getCurrentUser,
} from '@/utils/api';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import StatsGrid from './StatsGrid';
import QuickActions from './QuickActions';
import UpcomingTasks from './UpcomingTasks';
import RecentActivity from './RecentActivity';
import AISuggestions from './AISuggestions';
import WeeklyOverview from './WeeklyOverview';
import ProductivityInsights from './ProductivityInsights';
import ObjectivesOverview from './ObjectivesOverview';
import useAuth from '@/hooks/useAuth';

// Optimized interface with lazy loading flags
interface DashboardStats {
  user: any;
  tasks: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    completionRate: number;
    todayTasks: number;
    upcomingTasks: number;
  };
  goals: {
    total: number;
    active: number;
    completed: number;
    aiEnhanced: number;
  };
  objectives: {
    total: number;
    active: number;
    completed: number;
    thisMonth: number;
  };
  productivity: {
    score: number;
    insights: any[];
  };
  suggestions: any[];
  recentTasks: any[];
  upcomingTasks: any[];
  allTasks: any[];
}

// Cache for dashboard data
const dashboardCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

const DashboardContent = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Progressive loading states
  const [coreDataLoaded, setCoreDataLoaded] = useState(false);
  const [aiDataLoaded, setAiDataLoaded] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();

  // Memoize date calculations
  const dateCalculations = useMemo(() => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    return {
      today,
      nextWeek,
      todayStr: today.toISOString().split('T')[0],
      nextWeekStr: nextWeek.toISOString().split('T')[0],
    };
  }, []);

  // Check cache first
  const getCachedData = useCallback((key: string) => {
    const cached = dashboardCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }, []);

  // Set cache
  const setCachedData = useCallback((key: string, data: any) => {
    dashboardCache.set(key, { data, timestamp: Date.now() });
  }, []);

  // Optimized core data fetching (essential data only)
  const fetchCoreData = useCallback(
    async (forceRefresh = false) => {
      try {
        console.log(
          'Fetching core dashboard data...',
          forceRefresh ? '(forced)' : ''
        );

        // Check cache first only if not forcing refresh
        if (!forceRefresh) {
          const cacheKey = `dashboard-core-${user?.id}`;
          const cachedCore = getCachedData(cacheKey);
          if (cachedCore) {
            console.log('Using cached core data');
            setStats(cachedCore);
            setCoreDataLoaded(true);
            setLoading(false);
            return cachedCore;
          }
        } else {
          console.log('Forcing fresh data fetch, bypassing cache');
        }

        const { todayStr, nextWeekStr } = dateCalculations;

        // Fetch only essential data first (prioritize speed)
        const [allTasksResponse, todayTasksResponse] = await Promise.all([
          getAllTasks(), // Most critical
          getAllTasks({ startDate: todayStr, endDate: todayStr }), // Today's tasks
        ]);

        // Process tasks immediately for quick UI update
        const allTasks =
          allTasksResponse.success &&
          Array.isArray(allTasksResponse.data?.tasks)
            ? allTasksResponse.data.tasks
            : [];

        const todayTasks =
          todayTasksResponse.success &&
          Array.isArray(todayTasksResponse.data?.tasks)
            ? todayTasksResponse.data.tasks
            : [];

        // Quick stats calculation
        const completedTasks = allTasks.filter((t) => t.status === 'completed');
        const pendingTasks = allTasks.filter(
          (t) => t.status === 'pending' || t.status === 'in_progress'
        );
        const overdueTasks = allTasks.filter(
          (task) =>
            task.status !== 'completed' &&
            task.scheduledDate &&
            new Date(task.scheduledDate) < dateCalculations.today
        );

        const basicCompletionRate =
          allTasks.length > 0
            ? Math.round((completedTasks.length / allTasks.length) * 100)
            : 0;

        // Create basic stats for immediate display
        const quickStats: DashboardStats = {
          user: user || null,
          tasks: {
            total: allTasks.length,
            completed: completedTasks.length,
            pending: pendingTasks.length,
            overdue: overdueTasks.length,
            completionRate: basicCompletionRate,
            todayTasks: todayTasks.length,
            upcomingTasks: 0, // Will be loaded later
          },
          goals: { total: 0, active: 0, completed: 0, aiEnhanced: 0 },
          objectives: { total: 0, active: 0, completed: 0, thisMonth: 0 },
          productivity: { score: basicCompletionRate, insights: [] },
          suggestions: [],
          recentTasks: [],
          upcomingTasks: [],
          allTasks,
        };

        setStats(quickStats);
        setCoreDataLoaded(true);
        setLoading(false);

        // Cache the quick stats only if not forced refresh
        if (!forceRefresh) {
          const cacheKey = `dashboard-core-${user?.id}`;
          setCachedData(cacheKey, quickStats);
        }

        console.log('Core data loaded:', quickStats.tasks);

        // Continue loading remaining core data in background
        fetchRemainingCoreData(quickStats);

        return quickStats;
      } catch (err: any) {
        console.error('Core data fetch error:', err);
        setError(err.message || 'Failed to fetch dashboard data');
        setLoading(false);
      }
    },
    [user, dateCalculations, getCachedData, setCachedData]
  );

  // Fetch remaining core data (non-blocking)
  const fetchRemainingCoreData = useCallback(
    async (baseStats: DashboardStats) => {
      try {
        const { todayStr, nextWeekStr } = dateCalculations;

        // Fetch remaining essential data
        const [
          upcomingTasksResponse,
          goalsResponse,
          objectivesResponse,
          userResponse,
        ] = await Promise.all([
          getAllTasks({ startDate: todayStr, endDate: nextWeekStr }),
          getAllGoals(),
          getAllObjectives(),
          getCurrentUser(),
        ]);

        // Process additional data
        const upcomingTasks =
          upcomingTasksResponse.success &&
          Array.isArray(upcomingTasksResponse.data?.tasks)
            ? upcomingTasksResponse.data.tasks
            : [];

        const allGoals =
          goalsResponse.success && Array.isArray(goalsResponse.data?.goals)
            ? goalsResponse.data.goals
            : [];

        const allObjectives =
          objectivesResponse.success &&
          Array.isArray(objectivesResponse.data?.objectives)
            ? objectivesResponse.data.objectives
            : [];

        const thisMonthObjectives = allObjectives.filter(
          (obj) =>
            obj.targetMonth === dateCalculations.today.getMonth() + 1 &&
            obj.targetYear === dateCalculations.today.getFullYear()
        );

        // Get recent tasks
        const recentTasks = baseStats.allTasks
          .filter((task) => task.status === 'completed')
          .sort(
            (a, b) =>
              new Date(b.completedAt || b.updatedAt || 0).getTime() -
              new Date(a.completedAt || a.updatedAt || 0).getTime()
          )
          .slice(0, 5);

        // Update stats with complete data
        const completeStats: DashboardStats = {
          ...baseStats,
          user:
            userResponse.success && userResponse.data?.user
              ? userResponse.data.user
              : baseStats.user,
          tasks: {
            ...baseStats.tasks,
            upcomingTasks: upcomingTasks.length,
          },
          goals: {
            total: allGoals.length,
            active: allGoals.filter((g) => g.status === 'active').length,
            completed: allGoals.filter((g) => g.status === 'completed').length,
            aiEnhanced: allGoals.filter((g) => g.aiDecomposed).length,
          },
          objectives: {
            total: allObjectives.length,
            active: allObjectives.filter((o) => o.status === 'active').length,
            completed: allObjectives.filter((o) => o.status === 'completed')
              .length,
            thisMonth: thisMonthObjectives.length,
          },
          recentTasks,
          upcomingTasks: upcomingTasks.slice(0, 8),
        };

        setStats(completeStats);

        // Update cache
        const cacheKey = `dashboard-core-${user?.id}`;
        setCachedData(cacheKey, completeStats);

        console.log('Complete core data loaded');
      } catch (err) {
        console.warn('Failed to fetch remaining core data:', err);
        // Don't fail - we already have basic data
      }
    },
    [dateCalculations, user, setCachedData]
  );

  // Fetch AI data separately (non-blocking, background)
  const fetchAIData = useCallback(async () => {
    try {
      console.log('Loading AI features in background...');

      // Check cache for AI data
      const aiCacheKey = `dashboard-ai-${user?.id}`;
      const cachedAI = getCachedData(aiCacheKey);
      if (cachedAI) {
        console.log('Using cached AI data');
        setStats((prev) => (prev ? { ...prev, ...cachedAI } : prev));
        setAiDataLoaded(true);
        return;
      }

      // Use Promise.allSettled to handle failures gracefully
      const [suggestionsResult, productivityResult, statsResult] =
        await Promise.allSettled([
          user?.id
            ? getActiveSuggestions()
            : Promise.resolve({ success: false, data: { suggestions: [] } }),
          getProductivityInsightsFromAI(),
          getTaskCompletionStatistics(),
        ]);

      console.log('AI Results:', {
        suggestions: suggestionsResult.status,
        productivity: productivityResult.status,
        stats: statsResult.status,
      });

      // Process suggestions with proper error handling
      let suggestions: any[] = [];
      if (suggestionsResult.status === 'fulfilled') {
        const suggestionsData = suggestionsResult.value;
        console.log('Raw suggestions data:', suggestionsData);
        // Try all possible structures
        if (Array.isArray(suggestionsData)) {
          suggestions = suggestionsData;
        } else if (
          suggestionsData &&
          Array.isArray(suggestionsData?.data?.suggestions)
        ) {
          suggestions = suggestionsData?.data?.suggestions;
        } else if (
          suggestionsData &&
          Array.isArray(suggestionsData.data?.suggestions)
        ) {
          suggestions = suggestionsData.data.suggestions;
        } else if (
          suggestionsData &&
          suggestionsData.data &&
          Array.isArray(suggestionsData.data)
        ) {
          suggestions = suggestionsData.data;
        }
      }

      console.log('Extracted suggestions:', suggestions);

      // Process productivity insights with proper error handling
      let productivityData: {
        insights: any[];
        overall_productivity_score: number;
      } = { insights: [], overall_productivity_score: 0 };
      if (productivityResult.status === 'fulfilled') {
        const prodData = productivityResult.value;
        console.log('Raw productivity data:', prodData);

        if (prodData?.success && prodData.data) {
          productivityData = {
            insights: Array.isArray(prodData.data.insights)
              ? prodData.data.insights
              : [],
            overall_productivity_score:
              typeof prodData.data.overall_productivity_score === 'number'
                ? prodData.data.overall_productivity_score
                : 0,
          };
        }
      }

      // Process completion rate
      let completionRate = 0;
      if (statsResult.status === 'fulfilled') {
        const statsData = statsResult.value;
        if (statsData?.success && statsData.data?.stats?.completionRate) {
          completionRate = statsData.data.stats.completionRate;
        }
      }

      console.log('Processed AI data:', {
        suggestions: suggestions.length,
        insights: productivityData.insights.length,
        score: productivityData.overall_productivity_score,
        completionRate,
      });

      const aiData = {
        suggestions,
        productivity: {
          score:
            productivityData.overall_productivity_score || completionRate || 0,
          insights: productivityData.insights,
        },
      };

      // Update stats with AI data
      setStats((prev) => {
        if (!prev) return prev;

        const updated = {
          ...prev,
          suggestions: aiData.suggestions,
          productivity: {
            ...prev.productivity,
            score: aiData.productivity.score,
            insights: aiData.productivity.insights,
          },
          tasks: {
            ...prev.tasks,
            completionRate: completionRate || prev.tasks.completionRate,
          },
        };

        console.log('Updated stats with AI data:', updated.productivity);
        return updated;
      });

      // Cache AI data
      setCachedData(aiCacheKey, aiData);
      setAiDataLoaded(true);

      console.log('AI data loading completed');
    } catch (err) {
      console.error('AI data fetch error:', err);
      setAiDataLoaded(true); // Mark as complete even if failed
    }
  }, [user, getCachedData, setCachedData]);

  // Initial data fetch
  useEffect(() => {
    fetchCoreData();
  }, [fetchCoreData]);

  // Load AI data after core data
  useEffect(() => {
    if (coreDataLoaded && !aiDataLoaded) {
      // Delay AI data fetch to not block UI
      const timer = setTimeout(() => {
        fetchAIData();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [coreDataLoaded, aiDataLoaded, fetchAIData]);

  // Listen for task creation events
  useEffect(() => {
    const handleTaskCreated = () => {
      console.log('Task created event received, refreshing dashboard...');
      // Clear all caches
      const cacheKey = `dashboard-core-${user?.id}`;
      const aiCacheKey = `dashboard-ai-${user?.id}`;
      dashboardCache.delete(cacheKey);
      dashboardCache.delete(aiCacheKey);

      // Force fresh fetch
      fetchCoreData(true); // Force refresh = true
    };

    const handleTaskUpdated = () => {
      console.log('Task updated event received, refreshing dashboard...');
      const cacheKey = `dashboard-core-${user?.id}`;
      const aiCacheKey = `dashboard-ai-${user?.id}`;
      dashboardCache.delete(cacheKey);
      dashboardCache.delete(aiCacheKey);

      fetchCoreData(true);
    };

    const handleTaskCompleted = () => {
      console.log('Task completed event received, refreshing dashboard...');
      const cacheKey = `dashboard-core-${user?.id}`;
      const aiCacheKey = `dashboard-ai-${user?.id}`;
      dashboardCache.delete(cacheKey);
      dashboardCache.delete(aiCacheKey);

      fetchCoreData(true);
    };

    const handleTaskDeleted = () => {
      console.log('Task deleted event received, refreshing dashboard...');
      const cacheKey = `dashboard-core-${user?.id}`;
      const aiCacheKey = `dashboard-ai-${user?.id}`;
      dashboardCache.delete(cacheKey);
      dashboardCache.delete(aiCacheKey);

      fetchCoreData(true);
    };

    // Listen to all task-related events
    window.addEventListener('taskCreated', handleTaskCreated);
    window.addEventListener('taskUpdated', handleTaskUpdated);
    window.addEventListener('taskCompleted', handleTaskCompleted);
    window.addEventListener('taskDeleted', handleTaskDeleted);

    return () => {
      window.removeEventListener('taskCreated', handleTaskCreated);
      window.removeEventListener('taskUpdated', handleTaskUpdated);
      window.removeEventListener('taskCompleted', handleTaskCompleted);
      window.removeEventListener('taskDeleted', handleTaskDeleted);
    };
  }, [user, fetchCoreData]);

  // Memoize greeting calculation
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good Morning', icon: Sun };
    if (hour < 17) return { text: 'Good Afternoon', icon: Sun };
    if (hour < 21) return { text: 'Good Evening', icon: Coffee };
    return { text: 'Working Late', icon: Moon };
  }, []);

  const GreetingIcon = greeting.icon;

  // Add navigation-based refresh logic
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && coreDataLoaded) {
        console.log('Page became visible, refreshing dashboard...');
        // Clear cache and force refresh when page becomes visible
        const cacheKey = `dashboard-core-${user?.id}`;
        const aiCacheKey = `dashboard-ai-${user?.id}`;
        dashboardCache.delete(cacheKey);
        dashboardCache.delete(aiCacheKey);
        fetchCoreData(true);
      }
    };

    // Listen for page visibility changes (tab switching, coming back to page)
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, coreDataLoaded, fetchCoreData]);

  // Add storage event listener for cross-tab updates
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'dashboard-refresh-trigger') {
        console.log('Dashboard refresh triggered from another tab/page');
        const cacheKey = `dashboard-core-${user?.id}`;
        const aiCacheKey = `dashboard-ai-${user?.id}`;
        dashboardCache.delete(cacheKey);
        dashboardCache.delete(aiCacheKey);
        fetchCoreData(true);
        // Remove the trigger to prevent infinite loops
        localStorage.removeItem('dashboard-refresh-trigger');
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user, fetchCoreData]);

  // Listen for custom dashboard refresh events
  useEffect(() => {
    const handleDashboardRefresh = () => {
      console.log('Dashboard refresh event received');
      const cacheKey = `dashboard-core-${user?.id}`;
      const aiCacheKey = `dashboard-ai-${user?.id}`;
      dashboardCache.delete(cacheKey);
      dashboardCache.delete(aiCacheKey);
      fetchCoreData(true);
    };

    // Listen for dashboard-specific refresh events
    window.addEventListener('dashboardRefresh', handleDashboardRefresh);

    return () => {
      window.removeEventListener('dashboardRefresh', handleDashboardRefresh);
    };
  }, [user, fetchCoreData]);

  // Add a ref to track if component is mounted
  const isMountedRef = useRef(true);

  // Force refresh when component mounts (navigation to dashboard)
  useEffect(() => {
    // Always force refresh when navigating to dashboard
    console.log('Dashboard component mounted, forcing fresh data...');
    const cacheKey = `dashboard-core-${user?.id}`;
    const aiCacheKey = `dashboard-ai-${user?.id}`;
    dashboardCache.delete(cacheKey);
    dashboardCache.delete(aiCacheKey);

    // Reset loading states
    setCoreDataLoaded(false);
    setAiDataLoaded(false);

    // Force fetch with fresh data
    fetchCoreData(true);
  }, []); // Empty dependency array to run only on mount

  // Listen for navigation events and force refresh
  useEffect(() => {
    const handlePopState = () => {
      console.log('Navigation detected, clearing cache...');
      const cacheKey = `dashboard-core-${user?.id}`;
      const aiCacheKey = `dashboard-ai-${user?.id}`;
      dashboardCache.delete(cacheKey);
      dashboardCache.delete(aiCacheKey);
      fetchCoreData(true);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [user, fetchCoreData]);

  // Clear cache on component unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Clear cache when leaving dashboard
      const cacheKey = `dashboard-core-${user?.id}`;
      const aiCacheKey = `dashboard-ai-${user?.id}`;
      dashboardCache.delete(cacheKey);
      dashboardCache.delete(aiCacheKey);
    };
  }, [user]);

  // Progressive loading UI
  if (loading && !coreDataLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
        <Container className="py-8">
          {/* Fast loading skeleton */}
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-muted/30 rounded-3xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-muted/20 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
        <Container className="py-8">
          <div className="text-center py-20">
            <div className="w-32 h-32 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Activity className="w-16 h-16 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Dashboard Error
            </h2>
            <p className="text-muted-foreground mb-8">{error}</p>
            <Button onClick={fetchCoreData} variant="gradient">
              Try Again
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      <Container className="py-8">
        {/* Welcome Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-accent/10 to-success/10 rounded-3xl p-8 mb-8 border border-border/50">
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between">
            <div className="text-center lg:text-left mb-6 lg:mb-0">
              <div className="flex items-center gap-3 mb-4 justify-center lg:justify-start">
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg">
                  <GreetingIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {greeting.text}
                  </h1>
                  <p className="text-sm text-primary/60 font-medium">
                    {stats?.user?.firstName
                      ? `${stats.user.firstName}!`
                      : 'Welcome back!'}
                  </p>
                </div>
              </div>

              {stats && (
                <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                  <div className="bg-background/80 backdrop-blur-sm rounded-xl px-4 py-2 border border-border/50">
                    <span className="text-sm text-muted-foreground">
                      Today's Tasks:{' '}
                    </span>
                    <span className="font-bold text-foreground">
                      {stats.tasks.todayTasks}
                    </span>
                  </div>
                  <div className="bg-background/80 backdrop-blur-sm rounded-xl px-4 py-2 border border-border/50">
                    <span className="text-sm text-muted-foreground">
                      Productivity:{' '}
                    </span>
                    <span className="font-bold text-accent">
                      {Math.round(stats.productivity.score)}%
                    </span>
                    {!aiDataLoaded && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        ...
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <Button
                variant="gradient"
                size="lg"
                onClick={() => navigate('/dashboard/tasks')}
                className="min-w-[200px] shadow-2xl"
              >
                <Plus className="w-5 h-5 mr-2" />
                Quick Add Task
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        {stats && <StatsGrid stats={stats} />}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <WeeklyOverview stats={stats} />
            <ObjectivesOverview objectives={stats?.objectives} />
            {aiDataLoaded ? (
              <ProductivityInsights
                insights={stats?.productivity?.insights || []}
              />
            ) : (
              <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted/30 rounded w-1/3 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted/20 rounded w-full"></div>
                    <div className="h-3 bg-muted/20 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <QuickActions />
            <UpcomingTasks tasks={stats?.upcomingTasks || []} />
            <RecentActivity tasks={stats?.recentTasks || []} />
            {aiDataLoaded ? (
              <AISuggestions suggestions={stats?.suggestions || []} />
            ) : (
              <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted/30 rounded w-1/2 mb-4"></div>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 bg-muted/20 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
};

export default DashboardContent;