import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import {
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  Target,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  BarChart3,
  Lightbulb,
} from 'lucide-react';
import Container from '../../ui/Container';
import Button from '../../ui/Button';
import ObjectiveCard from './ObjectiveCard';
import ObjectiveModal from './ObjectiveModal';
import {
  getAllObjectives,
  getAllGoals,
  createNewObjective,
  updateExistingObjective,
  deleteObjective,
  updateObjectiveKeyResult,
} from '../../../utils/api';
import {
  Objective,
  Goal,
  ObjectiveFormData,
  ObjectiveUpdateData,
} from '../../../types/objectives';

const Objectives = () => {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState<Objective | null>(
    null
  );
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<
    'created' | 'month' | 'status' | 'title'
  >('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize filters from URL params
  const [filters, setFilters] = useState(() => {
    return {
      month: searchParams.get('month') || '',
      year: searchParams.get('year') || '',
      goalId: searchParams.get('goalId') || '',
      status: searchParams.get('status') || '',
    };
  });

  // Initialize search query from URL params
  useEffect(() => {
    const queryFromUrl = searchParams.get('search') || '';
    setSearchQuery(queryFromUrl);
  }, [searchParams]);

  // Initialize view mode from URL params
  useEffect(() => {
    const viewFromUrl = searchParams.get('view') as 'grid' | 'list';
    if (viewFromUrl && ['grid', 'list'].includes(viewFromUrl)) {
      setViewMode(viewFromUrl);
    }
  }, [searchParams]);

  // Initialize sort from URL params
  useEffect(() => {
    const sortFromUrl = searchParams.get('sort');
    const orderFromUrl = searchParams.get('order') as 'asc' | 'desc';

    if (
      sortFromUrl &&
      ['created', 'month', 'status', 'title'].includes(sortFromUrl)
    ) {
      setSortBy(sortFromUrl as any);
    }

    if (orderFromUrl && ['asc', 'desc'].includes(orderFromUrl)) {
      setSortOrder(orderFromUrl);
    }
  }, [searchParams]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    // Add non-empty filter values to URL
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.trim()) {
        params.set(key, value);
      }
    });

    // Add search query if present
    if (searchQuery && searchQuery.trim()) {
      params.set('search', searchQuery.trim());
    }

    // Add view mode if not default
    if (viewMode !== 'grid') {
      params.set('view', viewMode);
    }

    // Add sort parameters if not default
    if (sortBy !== 'created') {
      params.set('sort', sortBy);
    }

    if (sortOrder !== 'desc') {
      params.set('order', sortOrder);
    }

    // Only update URL if parameters have actually changed
    const newSearch = params.toString();
    const currentSearch = searchParams.toString();

    if (newSearch !== currentSearch) {
      setSearchParams(params, { replace: true });
    }
  }, [
    filters,
    searchQuery,
    viewMode,
    sortBy,
    sortOrder,
    setSearchParams,
    searchParams,
  ]);

  const statuses = [
    {
      value: 'active',
      label: 'Active',
      icon: TrendingUp,
      color: 'bg-info/10 text-info border-info/20',
      badgeColor: 'bg-info/20 text-info',
    },
    {
      value: 'completed',
      label: 'Completed',
      icon: CheckCircle,
      color: 'bg-success/10 text-success border-success/20',
      badgeColor: 'bg-success/20 text-success',
    },
    {
      value: 'paused',
      label: 'Paused',
      icon: Clock,
      color: 'bg-warning/10 text-warning border-warning/20',
      badgeColor: 'bg-warning/20 text-warning',
    },
    {
      value: 'cancelled',
      label: 'Cancelled',
      icon: AlertCircle,
      color: 'bg-muted/10 text-muted-foreground border-muted/20',
      badgeColor: 'bg-muted/20 text-muted-foreground',
    },
  ];

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);

  useEffect(() => {
    fetchObjectives();
    fetchGoals();
  }, [filters]);

  const fetchObjectives = async () => {
    try {
      setLoading(true);
      setError(null);

      const filterParams = Object.entries(filters).reduce(
        (acc, [key, value]) => {
          if (value) acc[key] = value;
          return acc;
        },
        {} as any
      );

      const response = await getAllObjectives(filterParams);
      if (response.success && response.data?.objectives) {
        // Transform the objectives to ensure they have all required fields
        const transformedObjectives: Objective[] = response.data.objectives.map(
          (obj: any) => ({
            ...obj,
            createdAt: obj.createdAt || new Date().toISOString(),
            progress: obj.progress || 0, // Ensure progress exists
          })
        );

        setObjectives(transformedObjectives);
      } else {
        setError(response.error || 'Failed to fetch objectives');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch objectives');
      console.error('Fetch objectives error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGoals = async () => {
    try {
      const response = await getAllGoals();
      if (response.success && response.data?.goals) {
        setGoals(response.data.goals);
      }
    } catch (err: any) {
      console.error('Failed to fetch goals:', err);
    }
  };

  // Enhanced filter handler that updates URL
  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  // Enhanced search handler that updates URL
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  // Enhanced view mode handler that updates URL
  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
  };

  // Enhanced sort handler that updates URL
  const handleSortChange = (sortValue: string) => {
    const [sort, order] = sortValue.split('-');
    setSortBy(sort as any);
    setSortOrder(order as 'asc' | 'desc');
  };

  // Utility function to generate shareable URL
  const getShareableUrl = () => {
    const currentUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim());
    }

    if (viewMode !== 'grid') {
      params.set('view', viewMode);
    }

    if (sortBy !== 'created') {
      params.set('sort', sortBy);
    }

    if (sortOrder !== 'desc') {
      params.set('order', sortOrder);
    }

    return params.toString()
      ? `${currentUrl}?${params.toString()}`
      : currentUrl;
  };

  const handleCreateObjective = async (formData: ObjectiveFormData) => {
    try {
      setSubmitting(true);
      setError(null);

      const response = await createNewObjective(formData);

      if (response.success && response.data?.objective) {
        const newObjective: Objective = {
          ...response.data.objective,
          description: response.data.objective.description ?? '',
          createdAt:
            response.data.objective.createdAt || new Date().toISOString(),
          progress: 0,
          status:
            (response.data.objective.status as
              | 'active'
              | 'completed'
              | 'paused') || 'active',
        };

        setObjectives((prev) => [newObjective, ...prev]);
        setShowCreateModal(false);

        // Trigger dashboard refresh
        localStorage.setItem(
          'dashboard-refresh-trigger',
          Date.now().toString()
        );
        window.dispatchEvent(new CustomEvent('dashboardRefresh'));
      } else {
        setError(response.error || 'Failed to create objective');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create objective');
      console.error('Create objective error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateObjective = async (formData: ObjectiveFormData) => {
    if (!selectedObjective) return;

    try {
      setSubmitting(true);
      setError(null);

      // Transform the form data to match what the API expects
      const updateData: Partial<Objective> = {
        goalId: formData.goalId,
        title: formData.title,
        description: formData.description,
        targetMonth: formData.targetMonth,
        targetYear: formData.targetYear,
        keyResults: formData.keyResults.map((kr) => ({
          id: kr.id || '', // Ensure id is always a string
          description: kr.description,
          targetValue: kr.targetValue,
          currentValue: kr.currentValue || 0,
          unit: kr.unit || '',
          completed: kr.completed || false,
        })),
      };

      const response = await updateExistingObjective(
        selectedObjective.id,
        updateData
      );

      if (response.success && response.data?.objective) {
        // Transform the updated objective to ensure it has all required fields
        const updatedObjective: Objective = {
          ...response.data.objective,
          createdAt:
            response.data.objective.createdAt || selectedObjective.createdAt,
          progress: response.data.objective.progress || 0,
        };

        setObjectives((prev) =>
          prev.map((obj) =>
            obj.id === updatedObjective.id ? updatedObjective : obj
          )
        );
        setShowEditModal(false);
        setSelectedObjective(null);
      } else {
        setError(response.error || 'Failed to update objective');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update objective');
      console.error('Update objective error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteObjective = async (objectiveId: string) => {
    if (!window.confirm('Are you sure you want to delete this objective?'))
      return;

    try {
      setError(null);
      const response = await deleteObjective(objectiveId);
      if (response.success) {
        setObjectives((prev) => prev.filter((obj) => obj.id !== objectiveId));
      } else {
        setError(response.error || 'Failed to delete objective');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete objective');
      console.error('Delete objective error:', err);
    }
  };

  const handleUpdateKeyResult = async (
    objectiveId: string,
    keyResultId: string,
    currentValue: number,
    completed: boolean
  ) => {
    try {
      const updateData: {
        keyResultId: string;
        currentValue?: number;
        completed?: boolean;
      } = {
        keyResultId, // Include keyResultId in the update data
      };

      // Only include fields that are being updated
      if (currentValue !== undefined) {
        updateData.currentValue = currentValue;
      }
      if (completed !== undefined) {
        updateData.completed = completed;
      }

      const response = await updateObjectiveKeyResult(objectiveId, updateData);

      if (response.success) {
        // Update the objective in state
        setObjectives((prev) =>
          prev.map((obj) => {
            if (obj.id === objectiveId) {
              const updatedKeyResults = obj.keyResults.map((kr) =>
                kr.id === keyResultId ? { ...kr, currentValue, completed } : kr
              );

              // Recalculate progress based on completed key results
              const completedCount = updatedKeyResults.filter(
                (kr) => kr.completed
              ).length;
              const progress =
                updatedKeyResults.length > 0
                  ? Math.round(
                      (completedCount / updatedKeyResults.length) * 100
                    )
                  : 0;

              return { ...obj, keyResults: updatedKeyResults, progress };
            }
            return obj;
          })
        );
      } else {
        setError(response.error || 'Failed to update key result');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update key result');
      console.error('Update key result error:', err);
    }
  };

  const openEditModal = (objective: Objective) => {
    setSelectedObjective(objective);
    setShowEditModal(true);
  };

  const clearFilters = () => {
    const clearedFilters = {
      month: '',
      year: '',
      goalId: '',
      status: '',
    };
    setFilters(clearedFilters);
    setSearchQuery(''); // Also clear search
  };

  // Calculate statistics
  const stats = {
    total: objectives.length,
    active: objectives.filter((obj) => obj.status === 'active').length,
    completed: objectives.filter((obj) => obj.status === 'completed').length,
    thisMonth: objectives.filter(
      (obj) =>
        obj.targetMonth === new Date().getMonth() + 1 &&
        obj.targetYear === new Date().getFullYear()
    ).length,
    completionRate:
      objectives.length > 0
        ? Math.round(
            (objectives.filter((obj) => obj.status === 'completed').length /
              objectives.length) *
              100
          )
        : 0,
  };

  // Enhanced filtering and sorting logic
  const filteredAndSortedObjectives = objectives
    .filter((objective) => {
      const matchesSearch =
        objective.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        objective.description
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        goals
          .find((g) => g.id === objective.goalId)
          ?.title.toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesFilters =
        (!filters.month || objective.targetMonth === parseInt(filters.month)) &&
        (!filters.year || objective.targetYear === parseInt(filters.year)) &&
        (!filters.goalId || objective.goalId === filters.goalId) &&
        (!filters.status || objective.status === filters.status);

      return matchesSearch && matchesFilters;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'month':
          comparison = a.targetMonth - b.targetMonth;
          if (comparison === 0) {
            comparison = a.targetYear - b.targetYear;
          }
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'created':
        default:
          comparison =
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
      }

      return sortOrder === 'desc' ? comparison : -comparison;
    });

  const getRelatedGoal = (goalId: string) => {
    return goals.find((g) => g.id === goalId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
        <Container className="py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-muted/20 rounded-3xl"></div>
            <div className="h-16 bg-muted/30 rounded-3xl w-1/2"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-64 bg-card/30 rounded-2xl border border-border/50"
                ></div>
              ))}
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      <Container className="py-8">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-accent/10 via-info/10 to-primary/10 rounded-3xl p-8 mb-8 border border-border/50">
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between space-y-6 lg:space-y-0">
            <div className="text-center lg:text-left">
              <div className="flex items-center gap-3 mb-4 justify-center lg:justify-start">
                <div className="w-14 h-14 bg-gradient-to-br from-accent to-info rounded-2xl flex items-center justify-center shadow-lg">
                  <Lightbulb className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-accent to-info bg-clip-text text-transparent">
                    Objectives Hub
                  </h1>
                  <p className="text-sm text-accent/60 font-medium">
                    Monthly Milestones & Key Results
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground text-lg mb-6">
                Transform your yearly goals into achievable monthly objectives
                with measurable outcomes
              </p>

              {/* Enhanced Statistics */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-background/80 backdrop-blur-sm rounded-2xl p-4 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-accent" />
                    <span className="text-xs text-muted-foreground font-medium">
                      Total
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {stats.total}
                  </div>
                </div>
                <div className="bg-background/80 backdrop-blur-sm rounded-2xl p-4 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-info" />
                    <span className="text-xs text-muted-foreground font-medium">
                      Active
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-info">
                    {stats.active}
                  </div>
                </div>
                <div className="bg-background/80 backdrop-blur-sm rounded-2xl p-4 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-xs text-muted-foreground font-medium">
                      Completed
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-success">
                    {stats.completed}
                  </div>
                </div>
                <div className="bg-background/80 backdrop-blur-sm rounded-2xl p-4 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground font-medium">
                      This Month
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {stats.thisMonth}
                  </div>
                </div>
                <div className="bg-background/80 backdrop-blur-sm rounded-2xl p-4 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-success" />
                    <span className="text-xs text-muted-foreground font-medium">
                      Success Rate
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-success">
                    {stats.completionRate}%
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                variant="gradient"
                size="lg"
                fullWidth={false}
                onClick={() => setShowCreateModal(true)}
                className="min-w-[200px] shadow-2xl"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create New Objective
              </Button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 bg-gradient-to-r from-destructive/10 to-destructive/5 border border-destructive/20 rounded-2xl p-6 animate-in slide-in-from-top duration-300">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center animate-pulse">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-destructive mb-1">
                  Error occurred
                </h3>
                <p className="text-destructive/80">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-destructive hover:text-destructive/80 transition-colors p-2 rounded-lg hover:bg-destructive/10"
              >
                <span className="text-xl">×</span>
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Search and Controls */}
        <div className="mb-8 space-y-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search objectives by title, description, or goal..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all duration-300 shadow-lg"
                />
                {searchQuery && (
                  <button
                    onClick={() => handleSearchChange('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl transition-all duration-300 ${
                  showFilters
                    ? 'bg-accent/10 border-accent/30 text-accent'
                    : 'hover:bg-card'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
                {Object.values(filters).some((f) => f) && (
                  <span className="bg-accent text-accent-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {Object.values(filters).filter((f) => f).length}
                  </span>
                )}
              </button>

              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => handleSortChange(e.target.value)}
                className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all duration-300 min-w-[140px]"
              >
                <option value="created-desc">Latest First</option>
                <option value="created-asc">Oldest First</option>
                <option value="month-asc">By Month (Early)</option>
                <option value="month-desc">By Month (Late)</option>
                <option value="status-asc">By Status</option>
                <option value="title-asc">A-Z</option>
                <option value="title-desc">Z-A</option>
              </select>

              <div className="flex bg-card/60 border border-border/50 rounded-xl p-1">
                <button
                  onClick={() => handleViewModeChange('grid')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'grid'
                      ? 'bg-accent text-accent-foreground shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleViewModeChange('list')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'list'
                      ? 'bg-accent text-accent-foreground shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Filters Panel */}
          {showFilters && (
            <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-6 animate-in slide-in-from-top duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Month
                  </label>
                  <select
                    value={filters.month}
                    onChange={(e) =>
                      handleFiltersChange({ ...filters, month: e.target.value })
                    }
                    className="w-full bg-background/60 border border-border/50 rounded-xl px-3 py-2 text-sm"
                  >
                    <option value="">All Months</option>
                    {months.map((month, index) => (
                      <option key={index} value={index + 1}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Year
                  </label>
                  <select
                    value={filters.year}
                    onChange={(e) =>
                      handleFiltersChange({ ...filters, year: e.target.value })
                    }
                    className="w-full bg-background/60 border border-border/50 rounded-xl px-3 py-2 text-sm"
                  >
                    <option value="">All Years</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Goal
                  </label>
                  <select
                    value={filters.goalId}
                    onChange={(e) =>
                      handleFiltersChange({
                        ...filters,
                        goalId: e.target.value,
                      })
                    }
                    className="w-full bg-background/60 border border-border/50 rounded-xl px-3 py-2 text-sm"
                  >
                    <option value="">All Goals</option>
                    {goals.map((goal) => (
                      <option key={goal.id} value={goal.id}>
                        {goal.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      handleFiltersChange({
                        ...filters,
                        status: e.target.value,
                      })
                    }
                    className="w-full bg-background/60 border border-border/50 rounded-xl px-3 py-2 text-sm"
                  >
                    <option value="">All Statuses</option>
                    {statuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {Object.values(filters).some((f) => f) && (
                <div className="mt-4 pt-4 border-t border-border/30">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="text-sm"
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Objectives Display */}
        {filteredAndSortedObjectives.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-40 h-40 bg-gradient-to-br from-accent/20 to-info/20 rounded-full flex items-center justify-center mx-auto mb-8">
              <Lightbulb className="w-20 h-20 text-accent/60" />
            </div>
            <h3 className="text-3xl font-bold text-foreground mb-4">
              {searchQuery || Object.values(filters).some((f) => f)
                ? 'No matching objectives found'
                : 'Your first objectives await'}
            </h3>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto text-lg">
              {searchQuery || Object.values(filters).some((f) => f)
                ? 'Try adjusting your search criteria or filters'
                : 'Break down your yearly goals into monthly objectives with measurable key results'}
            </p>
            {!searchQuery && !Object.values(filters).some((f) => f) && (
              <Button
                variant="gradient"
                size="xl"
                fullWidth={false}
                onClick={() => setShowCreateModal(true)}
                className="shadow-2xl"
              >
                <Plus className="w-6 h-6 mr-2" />
                Create Your First Objective
              </Button>
            )}
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            {filteredAndSortedObjectives.map((objective, index) => {
              const relatedGoal = getRelatedGoal(objective.goalId);

              return (
                <ObjectiveCard
                  key={objective.id}
                  objective={objective}
                  goalTitle={relatedGoal?.title}
                  goalCategory={relatedGoal?.category}
                  onEdit={openEditModal}
                  onDelete={handleDeleteObjective}
                  onUpdateKeyResult={handleUpdateKeyResult}
                  className={`animate-in fade-in slide-in-from-bottom`}
                  style={{ animationDelay: `${index * 100}ms` }}
                />
              );
            })}
          </div>
        )}

        {/* Create Objective Modal */}
        <ObjectiveModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateObjective}
          goals={goals}
          loading={submitting}
        />

        {/* Edit Objective Modal */}
        <ObjectiveModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedObjective(null);
          }}
          onSubmit={handleUpdateObjective}
          goals={goals}
          objective={selectedObjective}
          loading={submitting}
        />
      </Container>
    </div>
  );
};

export default Objectives;
