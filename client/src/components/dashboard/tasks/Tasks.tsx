import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { AlertCircle } from 'lucide-react';
import {
  getAllTasks,
  getTaskCompletionStatistics,
  deleteTask,
  markTaskCompleted,
  updateExistingTask,
} from '@/utils/api';
import { Task } from '@/types/models';
import Container from '@/components/ui/Container';
import TasksHeader from './TasksHeader';
import TaskFilters from './TaskFilters';
import TaskStats from './TaskStats';
import TasksList from './TasksList';
import TaskCreateModal from './TaskCreateModal';
import TaskEditModal from './TaskEditModal';
import { TaskFilters as TaskFiltersType } from '@/types/tasks';

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'calendar'>(
    'list'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [completingTask, setCompletingTask] = useState<string | null>(null);
  const [deletingTask, setDeletingTask] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  const [searchParams, setSearchParams] = useSearchParams();

  // Use refs to prevent unnecessary re-renders and debounce conflicts
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);
  const isUpdatingUrlRef = useRef(false);

  // Initialize filters from URL params with validation
  const [filters, setFilters] = useState<TaskFiltersType>(() => {
    const urlFilters = {
      startDate: searchParams.get('startDate') || '',
      endDate: searchParams.get('endDate') || '',
      status: searchParams.get('status') || '',
      priority: searchParams.get('priority') || '',
      objectiveId: searchParams.get('objectiveId') || '',
      goalId: searchParams.get('goalId') || '',
    };

    // Validate that objective belongs to goal if both are present
    if (urlFilters.goalId && urlFilters.objectiveId) {
      // This validation will be done after objectives are loaded
      console.log('Both goal and objective filters found in URL');
    }

    console.log('Initializing filters from URL:', urlFilters);
    return urlFilters;
  });

  // Initialize search query from URL params
  useEffect(() => {
    if (!isInitializedRef.current) {
      const queryFromUrl = searchParams.get('search') || '';
      setSearchQuery(queryFromUrl);

      const viewFromUrl = searchParams.get('view') as
        | 'grid'
        | 'list'
        | 'calendar';
      if (viewFromUrl && ['grid', 'list', 'calendar'].includes(viewFromUrl)) {
        setViewMode(viewFromUrl);
      }

      isInitializedRef.current = true;
    }
  }, [searchParams]);

  // Update URL when filters change - with proper debouncing
  useEffect(() => {
    // Skip URL updates during initialization or if we're already updating
    if (!isInitializedRef.current || isUpdatingUrlRef.current) {
      return;
    }

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
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
      if (viewMode !== 'list') {
        params.set('view', viewMode);
      }

      // Update URL without triggering navigation
      const newSearch = params.toString();
      const currentSearch = searchParams.toString();

      if (newSearch !== currentSearch) {
        isUpdatingUrlRef.current = true;
        setSearchParams(params, { replace: true });

        // Reset the flag after a brief delay
        setTimeout(() => {
          isUpdatingUrlRef.current = false;
        }, 100);
      }
    }, 500); // Increased debounce time to 500ms

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [filters, searchQuery, viewMode, setSearchParams]);

  // Fetch data when filters change - with debouncing
  useEffect(() => {
    if (!isInitializedRef.current) {
      return;
    }

    const timeoutId = setTimeout(() => {
      fetchTasks();
      fetchStats();
    }, 300); // Keep 300ms for data fetching

    return () => clearTimeout(timeoutId);
  }, [filters]);

  const fetchTasks = async () => {
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

      const response = await getAllTasks(filterParams);

      if (response.success && response.data && response.data.tasks) {
        setTasks(response.data.tasks);
      } else {
        setError(response.error || 'Failed to fetch tasks');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tasks');
      console.error('Fetch tasks error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const filterParams = Object.entries(filters).reduce(
        (acc, [key, value]) => {
          if (value) acc[key] = value;
          return acc;
        },
        {} as any
      );

      const response = await getTaskCompletionStatistics(filterParams);

      if (response.success && response.data) {
        console.log('Fetched stats:', response.data);
        setStats({
          ...response.data.stats,
          pending: response.data.stats.total - response.data.stats.completed,
        });
      }
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
    }
  };

  // Simplified filter handler without complex validation
  const handleFiltersChange = useCallback((newFilters: TaskFiltersType) => {
    console.log('Updating filters in Tasks component:', newFilters);
    setFilters(newFilters);
  }, []);

  // Enhanced search handler
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Enhanced view mode handler
  const handleViewModeChange = useCallback(
    (mode: 'grid' | 'list' | 'calendar') => {
      setViewMode(mode);
    },
    []
  );

  // Initial data fetch
  useEffect(() => {
    if (isInitializedRef.current) {
      fetchTasks();
      fetchStats();
    }
  }, []); // Only run once on mount

  // Add a callback to refresh parent data when task is created
  const handleTaskCreated = (newTask: Task) => {
    console.log('Task created:', newTask);
    setTasks((prevTasks) => [...prevTasks, newTask]);
    setShowCreateModal(false);
    fetchStats();
    fetchTasks();
    localStorage.setItem('dashboard-refresh-trigger', Date.now().toString());
    window.dispatchEvent(new CustomEvent('dashboardRefresh'));
    window.dispatchEvent(new CustomEvent('taskCreated', { detail: newTask }));
  };

  const handleTaskUpdated = async (updatedTaskData: Partial<Task>) => {
    if (!selectedTask) return;

    try {
      setError(null);

      const response = await updateExistingTask(
        selectedTask.id,
        updatedTaskData
      );

      if (response.success && response.data && response.data.task) {
        const updatedTask = response.data.task;
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === updatedTask.id ? updatedTask : task
          )
        );
        setSelectedTask(null);
        setShowEditModal(false);
        fetchStats();
      } else {
        setError(response.error || 'Failed to update task');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update task');
      console.error('Update task error:', err);
    }
  };

  const handleTaskDeleted = async (taskId: string) => {
    try {
      setDeletingTask(taskId);
      setError(null);

      const response = await deleteTask(taskId);

      if (response.success) {
        setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
        fetchStats();
      } else {
        setError(response.error || 'Failed to delete task');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete task');
      console.error('Delete task error:', err);
    } finally {
      setDeletingTask(null);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    setCompletingTask(taskId);
    try {
      const response = await markTaskCompleted(taskId);
      if (response.success) {
        // Update local state
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  status: 'completed',
                  completedAt: new Date().toISOString(),
                }
              : task
          )
        );

        // Trigger dashboard refresh
        localStorage.setItem(
          'dashboard-refresh-trigger',
          Date.now().toString()
        );
        window.dispatchEvent(new CustomEvent('dashboardRefresh'));
        window.dispatchEvent(
          new CustomEvent('taskCompleted', { detail: { taskId } })
        );

        fetchTasks();
        fetchStats();
      } else {
        setError(response.error || 'Failed to complete task');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete task');
      console.error('Complete task error:', err);
    } finally {
      setCompletingTask(null);
    }
  };

  const openEditModal = (task: Task) => {
    setSelectedTask(task);
    setShowEditModal(true);
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
        <TasksHeader
          onCreateTask={() => setShowCreateModal(true)}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          stats={stats}
        />

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

        <TaskFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
        />

        {stats && <TaskStats stats={stats} />}

        <TasksList
          tasks={tasks}
          searchQuery={searchQuery}
          viewMode={viewMode}
          onEditTask={openEditModal}
          onDeleteTask={handleTaskDeleted}
          onCompleteTask={handleCompleteTask}
          completingTask={completingTask}
          setCompletingTask={setCompletingTask}
          deletingTask={deletingTask}
        />

        {showCreateModal && (
          <TaskCreateModal
            onClose={() => setShowCreateModal(false)}
            onTaskCreated={handleTaskCreated}
          />
        )}

        {showEditModal && selectedTask && (
          <TaskEditModal
            task={selectedTask}
            onClose={() => {
              setShowEditModal(false);
              setSelectedTask(null);
            }}
            onTaskUpdated={handleTaskUpdated}
          />
        )}
      </Container>
    </div>
  );
};

export default Tasks;
