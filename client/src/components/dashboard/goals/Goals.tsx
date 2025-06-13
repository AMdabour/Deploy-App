import React, { useState, useEffect } from 'react';
import {
  Plus,
  Target,
  Calendar,
  Trash2,
  Edit,
  Brain,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  BookOpen,
  Trophy,
  Sparkles,
  BarChart3,
  Lightbulb,
  CheckSquare, // Add this import
} from 'lucide-react';
import {
  getAllGoals,
  createNewGoal,
  updateExistingGoal,
  deleteGoal,
  decomposeGoalIntoObjectives,
} from '@/utils/api';
import { Goal } from '@/types/models';
import Container from '@/components/ui/Container';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useNavigate } from 'react-router'; // Add this import

interface GoalFormData {
  title: string;
  description: string;
  category: string;
  targetYear: number;
  priority: string;
}

const Goals = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<
    'created' | 'priority' | 'year' | 'status'
  >('created');
  const [filters, setFilters] = useState({
    year: '',
    category: '',
    status: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [decomposingGoal, setDecomposingGoal] = useState<string | null>(null);

  const [formData, setFormData] = useState<GoalFormData>({
    title: '',
    description: '',
    category: '',
    targetYear: new Date().getFullYear(),
    priority: 'medium',
  });

  const navigate = useNavigate();

  const categories = [
    {
      value: 'career',
      label: 'Career',
      icon: '💼',
      color: 'from-blue-500 to-indigo-600',
      description: 'Professional growth and development',
    },
    {
      value: 'health',
      label: 'Health',
      icon: '🏥',
      color: 'from-green-500 to-emerald-600',
      description: 'Physical and mental wellness',
    },
    {
      value: 'personal',
      label: 'Personal',
      icon: '👤',
      color: 'from-purple-500 to-violet-600',
      description: 'Self-improvement and relationships',
    },
    {
      value: 'financial',
      label: 'Financial',
      icon: '💰',
      color: 'from-yellow-500 to-orange-600',
      description: 'Money management and investments',
    },
    {
      value: 'education',
      label: 'Education',
      icon: '📚',
      color: 'from-pink-500 to-rose-600',
      description: 'Learning and skill development',
    },
    {
      value: 'other',
      label: 'Other',
      icon: '🎯',
      color: 'from-gray-500 to-slate-600',
      description: 'Miscellaneous goals',
    },
  ];

  const priorities = [
    {
      value: 'low',
      label: 'Low',
      icon: '🟢',
      color: 'bg-muted/50 text-muted-foreground border-muted',
    },
    {
      value: 'medium',
      label: 'Medium',
      icon: '🟡',
      color: 'bg-info/10 text-info border-info/20',
    },
    {
      value: 'high',
      label: 'High',
      icon: '🟠',
      color: 'bg-warning/10 text-warning border-warning/20',
    },
    {
      value: 'critical',
      label: 'Critical',
      icon: '🔴',
      color: 'bg-destructive/10 text-destructive border-destructive/20',
    },
  ];

  const statuses = [
    {
      value: 'active',
      label: 'Active',
      color: 'bg-success/10 text-success border-success/20',
      icon: TrendingUp,
    },
    {
      value: 'completed',
      label: 'Completed',
      color: 'bg-primary/10 text-primary border-primary/20',
      icon: CheckCircle,
    },
    {
      value: 'on_hold',
      label: 'On Hold',
      color: 'bg-warning/10 text-warning border-warning/20',
      icon: Clock,
    },
    {
      value: 'cancelled',
      label: 'Cancelled',
      color: 'bg-destructive/10 text-destructive border-destructive/20',
      icon: AlertCircle,
    },
  ];

  useEffect(() => {
    fetchGoals();
  }, [filters]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      setError(null);

      // Apply filters to API call
      const filterParams = Object.entries(filters).reduce(
        (acc, [key, value]) => {
          if (value) acc[key] = value;
          return acc;
        },
        {} as any
      );

      console.log('Applying goal filters:', filterParams);

      const response = await getAllGoals(filterParams); // Pass filters to API
      if (response.success && response.data && response.data.goals) {
        setGoals(response.data.goals);
      } else {
        setError('Failed to fetch goals');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch goals');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (formData: GoalFormData) => {
    try {
      setSubmitting(true);
      setError(null);

      const response = await createNewGoal(formData);

      if (response.success && response.data?.goal) {
        if (response.data && response.data.goal) {
          setGoals((prev) => [response.data!.goal, ...prev]);
        }
        setShowCreateModal(false);

        // Trigger dashboard refresh
        localStorage.setItem(
          'dashboard-refresh-trigger',
          Date.now().toString()
        );
        window.dispatchEvent(new CustomEvent('dashboardRefresh'));
      } else {
        setError(response.error || 'Failed to create goal');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create goal');
      console.error('Create goal error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;

    try {
      setSubmitting(true);
      const response = await updateExistingGoal(selectedGoal.id, formData);
      if (response.success) {
        setGoals(
          goals.map((goal) =>
            goal.id === selectedGoal.id ? { ...goal, ...formData } : goal
          )
        );
        setShowEditModal(false);
        setSelectedGoal(null);
        resetForm();
      } else {
        setError('Failed to update goal');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update goal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this goal? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      const response = await deleteGoal(goalId);
      if (response.success) {
        setGoals(goals.filter((goal) => goal.id !== goalId));
      } else {
        setError('Failed to delete goal');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete goal');
    }
  };

  const handleDecomposeGoal = async (goalId: string) => {
    try {
      setDecomposingGoal(goalId);
      const response = await decomposeGoalIntoObjectives(goalId);
      if (response.success) {
        setGoals(
          goals.map((goal) =>
            goal.id === goalId ? { ...goal, aiDecomposed: true } : goal
          )
        );
      } else {
        setError('Failed to decompose goal');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to decompose goal');
    } finally {
      setDecomposingGoal(null);
    }
  };

  const openEditModal = (goal: Goal) => {
    setSelectedGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || '',
      category: goal.category,
      targetYear: goal.targetYear,
      priority: goal.priority,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      targetYear: new Date().getFullYear(),
      priority: 'medium',
    });
  };

  // Enhanced filtering and sorting
  const filteredAndSortedGoals = goals
    .filter((goal) => {
      // Search filter
      const matchesSearch =
        goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        goal.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        goal.category.toLowerCase().includes(searchQuery.toLowerCase());

      // Year filter
      const matchesYear =
        !filters.year || goal.targetYear.toString() === filters.year;

      // Category filter
      const matchesCategory =
        !filters.category || goal.category === filters.category;

      // Status filter
      const matchesStatus = !filters.status || goal.status === filters.status;

      return matchesSearch && matchesYear && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return (
            priorityOrder[b.priority as keyof typeof priorityOrder] -
            priorityOrder[a.priority as keyof typeof priorityOrder]
          );
        case 'year':
          return a.targetYear - b.targetYear;
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

  const getPriorityColor = (priority: string) => {
    return (
      priorities.find((p) => p.value === priority)?.color ||
      'bg-gray-100 text-gray-800'
    );
  };

  const getStatusColor = (status: string) => {
    return (
      statuses.find((s) => s.value === status)?.color ||
      'bg-gray-100 text-gray-800'
    );
  };

  const navigateToTasks = (goalId: string, goalTitle: string) => {
    navigate(
      `/dashboard/tasks?goalId=${goalId}&goalTitle=${encodeURIComponent(
        goalTitle
      )}`
    );
  };

  const navigateToObjectives = (goalId: string, goalTitle: string) => {
    navigate(
      `/dashboard/objectives?goalId=${goalId}&goalTitle=${encodeURIComponent(
        goalTitle
      )}`
    );
  };

  // Calculate statistics
  const stats = {
    total: goals.length,
    completed: goals.filter((g) => g.status === 'completed').length,
    active: goals.filter((g) => g.status === 'active').length,
    aiEnhanced: goals.filter((g) => g.aiDecomposed).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
        <Container className="py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-16 bg-muted/30 rounded-3xl w-1/2"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-muted/20 rounded-2xl"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-card/30 rounded-2xl p-6 border border-border/50"
                >
                  <div className="h-6 bg-muted/30 rounded-lg mb-4"></div>
                  <div className="h-4 bg-muted/20 rounded mb-2"></div>
                  <div className="h-4 bg-muted/20 rounded w-3/4"></div>
                </div>
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
        {/* Enhanced Header with animated background */}
        <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-accent/10 to-success/10 rounded-3xl p-8 mb-8 border border-border/50">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent animate-pulse"></div>
          {/* Floating particles effect */}
          <div className="absolute inset-0">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`absolute w-2 h-2 bg-primary/20 rounded-full animate-bounce`}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              ></div>
            ))}
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between space-y-6 lg:space-y-0">
            <div className="text-center lg:text-left">
              <div className="flex items-center gap-3 mb-4 justify-center lg:justify-start">
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Goals Hub
                  </h1>
                  <p className="text-sm text-primary/60 font-medium">
                    Achievement Central
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground text-lg mb-6">
                Transform your ambitions into achievements with AI-powered
                strategic planning
              </p>

              {/* Enhanced Statistics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-background/80 backdrop-blur-sm rounded-2xl p-4 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-primary" />
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
                    <Sparkles className="w-4 h-4 text-accent" />
                    <span className="text-xs text-muted-foreground font-medium">
                      AI Enhanced
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-accent">
                    {stats.aiEnhanced}
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
                Create New Goal
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Error Alert */}
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
              <Input
                variant="search"
                size="lg"
                placeholder="Search goals by title, description, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery('')}
                className="shadow-lg"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300 min-w-[140px]"
              >
                <option value="created">Latest First</option>
                <option value="priority">By Priority</option>
                <option value="year">By Year</option>
                <option value="status">By Status</option>
              </select>
              <div className="flex bg-card/60 border border-border/50 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 rounded-lg transition-all ${
                    viewMode === 'grid'
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 rounded-lg transition-all ${
                    viewMode === 'list'
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  List
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {[
              {
                key: 'year',
                label: 'Year',
                options: Array.from({ length: 5 }, (_, i) => ({
                  value: new Date().getFullYear() + i,
                  label: (new Date().getFullYear() + i).toString(),
                })),
              },
              {
                key: 'category',
                label: 'Category',
                options: categories.map((c) => ({
                  value: c.value,
                  label: `${c.icon} ${c.label}`,
                })),
              },
              {
                key: 'status',
                label: 'Status',
                options: statuses.map((s) => ({
                  value: s.value,
                  label: s.label,
                })),
              },
            ].map(({ key, label, options }) => (
              <select
                key={key}
                value={filters[key as keyof typeof filters]}
                onChange={(e) =>
                  setFilters({ ...filters, [key]: e.target.value })
                }
                className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300 min-w-[140px]"
              >
                <option value="">All {label}s</option>
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ))}
            {Object.values(filters).some((f) => f) && (
              <Button
                variant="outline"
                size="md"
                fullWidth={false}
                onClick={() =>
                  setFilters({ year: '', category: '', status: '' })
                }
                className="px-4"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Enhanced Goals Display */}
        {filteredAndSortedGoals.length === 0 ? (
          <div className="text-center py-20">
            <div className="relative">
              <div className="w-40 h-40 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mx-auto mb-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 animate-spin"></div>
                <Target className="w-20 h-20 text-primary/60 relative z-10" />
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-4">
                {searchQuery || Object.values(filters).some((f) => f)
                  ? 'No matching goals found'
                  : 'Your goal journey starts here'}
              </h3>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto text-lg">
                {searchQuery || Object.values(filters).some((f) => f)
                  ? 'Try adjusting your search criteria or filters to discover your goals'
                  : 'Create your first goal and let AI help you break it down into achievable milestones'}
              </p>
              {!searchQuery && !Object.values(filters).some((f) => f) && (
                <div className="space-y-4">
                  <Button
                    variant="gradient"
                    size="xl"
                    fullWidth={false}
                    onClick={() => setShowCreateModal(true)}
                    className="shadow-2xl"
                  >
                    <Lightbulb className="w-6 h-6 mr-2" />
                    Create Your First Goal
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    💡 Tip: Start with a clear, specific goal like "Learn web
                    development" or "Run a marathon"
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            {filteredAndSortedGoals.map((goal, index) => {
              const category = categories.find(
                (c) => c.value === goal.category
              );
              const status = statuses.find((s) => s.value === goal.status);
              const priority = priorities.find(
                (p) => p.value === goal.priority
              );
              const StatusIcon = status?.icon || Target;

              return (
                <div
                  key={goal.id}
                  className={`group bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl hover:shadow-2xl transition-all duration-500 animate-in fade-in slide-in-from-bottom ${
                    viewMode === 'grid'
                      ? 'p-6 hover:scale-[1.02]'
                      : 'p-4 hover:bg-card/90 flex items-center gap-6'
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {viewMode === 'grid' ? (
                    <>
                      {/* Grid View */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-12 h-12 bg-gradient-to-br ${
                              category?.color || 'from-gray-500 to-slate-600'
                            } rounded-xl flex items-center justify-center text-white text-lg shadow-lg`}
                          >
                            {category?.icon || '🎯'}
                          </div>
                          <div>
                            <h3 className="font-bold text-foreground text-xl mb-1 group-hover:text-primary transition-colors">
                              {goal.title}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-1 rounded-lg text-xs font-medium ${getPriorityColor(
                                  goal.priority
                                )}`}
                              >
                                {goal.priority}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {goal.targetYear}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {goal.aiDecomposed && (
                            <div className="text-success">
                              <Sparkles className="w-4 h-4" />
                            </div>
                          )}
                          <button
                            onClick={() => openEditModal(goal)}
                            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-200"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteGoal(goal.id)}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {goal.description && (
                        <p className="text-muted-foreground text-sm mb-6 line-clamp-2">
                          {goal.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StatusIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground capitalize">
                            {goal.status.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Navigate to Objectives */}
                          <button
                            onClick={() =>
                              navigateToObjectives(goal.id, goal.title)
                            }
                            className="flex items-center gap-1 px-3 py-1.5 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg transition-all duration-200 text-xs font-medium"
                            title="View related objectives"
                          >
                            <Lightbulb className="w-3 h-3" />
                            Objectives
                          </button>

                          {/* Navigate to Tasks */}
                          <button
                            onClick={() => navigateToTasks(goal.id, goal.title)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-info/10 hover:bg-info/20 text-info rounded-lg transition-all duration-200 text-xs font-medium"
                            title="View related tasks"
                          >
                            <CheckSquare className="w-3 h-3" />
                            Tasks
                          </button>

                          {!goal.aiDecomposed && (
                            <button
                              onClick={() => handleDecomposeGoal(goal.id)}
                              disabled={decomposingGoal === goal.id}
                              className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 text-primary rounded-lg transition-all duration-200 text-xs font-medium disabled:opacity-50"
                              title="AI-powered goal decomposition"
                            >
                              {decomposingGoal === goal.id ? (
                                <>
                                  <div className="w-3 h-3 border border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                  <span className="font-medium">
                                    Processing...
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Brain className="w-3 h-3" />
                                  <span className="font-medium">
                                    AI Enhance
                                  </span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* List View */}
                      <div
                        className={`w-12 h-12 bg-gradient-to-br ${
                          category?.color || 'from-gray-500 to-slate-600'
                        } rounded-xl flex items-center justify-center text-white text-lg shadow-lg`}
                      >
                        {category?.icon || '🎯'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-foreground text-lg truncate group-hover:text-primary transition-colors">
                            {goal.title}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-lg text-xs font-medium ${getPriorityColor(
                              goal.priority
                            )}`}
                          >
                            {goal.priority}
                          </span>
                        </div>
                        {goal.description && (
                          <p className="text-muted-foreground text-sm line-clamp-2 mb-2">
                            {goal.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{category?.label}</span>
                          <span>Target: {goal.targetYear}</span>
                          <span
                            className={`px-2 py-1 rounded ${getStatusColor(
                              goal.status
                            )}`}
                          >
                            {goal.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Navigate to Objectives */}
                        <button
                          onClick={() =>
                            navigateToObjectives(goal.id, goal.title)
                          }
                          className="flex items-center gap-1 px-2 py-1 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg transition-all duration-200 text-xs"
                          title="View related objectives"
                        >
                          <Lightbulb className="w-3 h-3" />
                          Objectives
                        </button>

                        {/* Navigate to Tasks */}
                        <button
                          onClick={() => navigateToTasks(goal.id, goal.title)}
                          className="flex items-center gap-1 px-2 py-1 bg-info/10 hover:bg-info/20 text-info rounded-lg transition-all duration-200 text-xs"
                          title="View related tasks"
                        >
                          <CheckSquare className="w-3 h-3" />
                          Tasks
                        </button>

                        {goal.aiDecomposed && (
                          <div className="text-success">
                            <Sparkles className="w-4 h-4" />
                          </div>
                        )}
                        <button
                          onClick={() => openEditModal(goal)}
                          className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-200"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Enhanced Create Goal Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
            <div className="bg-card/95 backdrop-blur-lg border border-border/50 rounded-3xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-foreground">
                      Create New Goal
                    </h2>
                    <p className="text-muted-foreground">
                      Define your next achievement milestone
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleCreateGoal(formData);
                  }}
                  className="space-y-6"
                >
                  <Input
                    label="Goal Title"
                    variant="name"
                    size="lg"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g., Master React Development, Run a Marathon..."
                    required
                    className="text-lg"
                  />

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-3">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="w-full bg-background/60 border border-border/50 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300 resize-none text-foreground placeholder:text-muted-foreground"
                      placeholder="Describe your goal in detail. What will success look like?"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-3">
                        Category
                      </label>
                      <select
                        required
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                        className="w-full bg-background/60 border border-border/50 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300"
                      >
                        <option value="">Choose category</option>
                        {categories.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.icon} {category.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-3">
                        Target Year
                      </label>
                      <select
                        value={formData.targetYear}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            targetYear: parseInt(e.target.value),
                          })
                        }
                        className="w-full bg-background/60 border border-border/50 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300"
                      >
                        {Array.from(
                          { length: 5 },
                          (_, i) => new Date().getFullYear() + i
                        ).map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-3">
                        Priority Level
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) =>
                          setFormData({ ...formData, priority: e.target.value })
                        }
                        className="w-full bg-background/60 border border-border/50 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300"
                      >
                        {priorities.map((priority) => (
                          <option key={priority.value} value={priority.value}>
                            {priority.icon} {priority.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-8 border-t border-border/50">
                    <Button
                      variant="outline"
                      size="lg"
                      fullWidth={false}
                      onClick={() => {
                        setShowCreateModal(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="gradient"
                      size="lg"
                      loading={submitting}
                      fullWidth={false}
                      className="min-w-[160px] shadow-xl"
                    >
                      <Target className="w-5 h-5 mr-2" />
                      Create Goal
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Similar enhanced styling for Edit Modal... */}
        {showEditModal && selectedGoal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
            <div className="bg-card/95 backdrop-blur-lg border border-border/50 rounded-3xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg">
                    <Edit className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-foreground">
                      Edit Goal
                    </h2>
                    <p className="text-muted-foreground">
                      Update your goal details
                    </p>
                  </div>
                </div>

                <form onSubmit={handleUpdateGoal} className="space-y-6">
                  <Input
                    label="Goal Title"
                    variant="name"
                    size="lg"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Enter goal title..."
                    required
                    className="text-lg"
                  />

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-3">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="w-full bg-background/60 border border-border/50 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300 resize-none text-foreground placeholder:text-muted-foreground"
                      placeholder="Describe your goal..."
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-3">
                        Category
                      </label>
                      <select
                        required
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                        className="w-full bg-background/60 border border-border/50 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300"
                      >
                        <option value="">Select category</option>
                        {categories.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.icon} {category.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-3">
                        Target Year
                      </label>
                      <select
                        value={formData.targetYear}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            targetYear: parseInt(e.target.value),
                          })
                        }
                        className="w-full bg-background/60 border border-border/50 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300"
                      >
                        {Array.from(
                          { length: 5 },
                          (_, i) => new Date().getFullYear() + i
                        ).map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-3">
                        Priority Level
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) =>
                          setFormData({ ...formData, priority: e.target.value })
                        }
                        className="w-full bg-background/60 border border-border/50 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300"
                      >
                        {priorities.map((priority) => (
                          <option key={priority.value} value={priority.value}>
                            {priority.icon} {priority.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-8 border-t border-border/50">
                    <Button
                      variant="outline"
                      size="lg"
                      fullWidth={false}
                      onClick={() => {
                        setShowEditModal(false);
                        setSelectedGoal(null);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="gradient"
                      size="lg"
                      loading={submitting}
                      fullWidth={false}
                      className="min-w-[160px] shadow-xl"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Update Goal
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
};

export default Goals;
