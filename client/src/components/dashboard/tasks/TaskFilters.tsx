import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { getAllGoals, getAllObjectives } from '@/utils/api';
import { Goal, Objective } from '@/types/models';
import {
  TaskFilters as TaskFiltersType,
  taskStatuses,
  taskPriorities,
} from '@/types/tasks';

interface TaskFiltersProps {
  filters: TaskFiltersType;
  onFiltersChange: (filters: TaskFiltersType) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const TaskFilters: React.FC<TaskFiltersProps> = ({
  filters,
  onFiltersChange,
  searchQuery,
  onSearchChange,
}) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGoalsAndObjectives();
  }, []);

  // Memoize filtered objectives to prevent unnecessary re-calculations
  const filteredObjectives = useMemo(() => {
    if (!filters.goalId) {
      return objectives;
    }
    return objectives.filter((obj) => obj.goalId === filters.goalId);
  }, [objectives, filters.goalId]);

  const fetchGoalsAndObjectives = async () => {
    try {
      setLoading(true);
      const [goalsResponse, objectivesResponse] = await Promise.all([
        getAllGoals(),
        getAllObjectives(),
      ]);

      if (goalsResponse.success && goalsResponse.data?.goals) {
        setGoals(goalsResponse.data.goals);
      }

      if (objectivesResponse.success && objectivesResponse.data?.objectives) {
        setObjectives(objectivesResponse.data.objectives);
      }
    } catch (err) {
      console.error('Failed to fetch goals and objectives:', err);
    } finally {
      setLoading(false);
    }
  };

  // Simplified filter change handler without recursive updates
  const handleFilterChange = useCallback(
    (key: keyof TaskFiltersType, value: string) => {
      console.log('Filter change requested:', key, value);

      const newFilters = { ...filters };

      if (key === 'goalId') {
        newFilters.goalId = value;

        // If changing goal and current objective doesn't belong to new goal, clear it
        if (value && filters.objectiveId) {
          const objectiveBelongsToGoal = objectives.some(
            (obj) => obj.id === filters.objectiveId && obj.goalId === value
          );
          if (!objectiveBelongsToGoal) {
            newFilters.objectiveId = '';
          }
        }

        // If clearing goal, clear objective too
        if (!value) {
          newFilters.objectiveId = '';
        }
      } else if (key === 'objectiveId') {
        newFilters.objectiveId = value;

        // If selecting an objective and no goal is selected, auto-select the goal
        if (value && !filters.goalId) {
          const selectedObjective = objectives.find((obj) => obj.id === value);
          if (selectedObjective) {
            newFilters.goalId = selectedObjective.goalId;
          }
        }
      } else {
        newFilters[key] = value;
      }

      console.log('Applying filter change:', newFilters);
      onFiltersChange(newFilters);
    },
    [filters, objectives, onFiltersChange]
  );

  const clearFilters = useCallback(() => {
    onFiltersChange({
      startDate: '',
      endDate: '',
      status: '',
      priority: '',
      objectiveId: '',
      goalId: '',
    });
    onSearchChange('');
  }, [onFiltersChange, onSearchChange]);

  const hasActiveFilters = Object.values(filters).some((value) => value);

  return (
    <div className="mb-8 space-y-6">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <Input
            variant="search"
            size="lg"
            placeholder="Search tasks by title, description, tags, or location..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onClear={() => onSearchChange('')}
            className="shadow-lg"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {/* Date Range Inputs */}
        <div className="flex gap-2">
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl px-4 py-2 focus:ring-2 focus:ring-info/50 focus:border-info/50 transition-all duration-300"
            placeholder="Start Date"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl px-4 py-2 focus:ring-2 focus:ring-info/50 focus:border-info/50 transition-all duration-300"
            placeholder="End Date"
          />
        </div>

        {/* Goal Filter */}
        <select
          value={filters.goalId}
          onChange={(e) => handleFilterChange('goalId', e.target.value)}
          className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl px-4 py-2 focus:ring-2 focus:ring-info/50 focus:border-info/50 transition-all duration-300 min-w-[160px]"
          disabled={loading}
        >
          <option value="">All Goals</option>
          {goals.map((goal) => (
            <option key={goal.id} value={goal.id}>
              {goal.title}
            </option>
          ))}
        </select>

        {/* Objective Filter */}
        <select
          value={filters.objectiveId}
          onChange={(e) => handleFilterChange('objectiveId', e.target.value)}
          className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl px-4 py-2 focus:ring-2 focus:ring-info/50 focus:border-info/50 transition-all duration-300 min-w-[160px]"
          disabled={loading}
        >
          <option value="">All Objectives</option>
          {filteredObjectives.map((objective) => (
            <option key={objective.id} value={objective.id}>
              {objective.title}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl px-4 py-2 focus:ring-2 focus:ring-info/50 focus:border-info/50 transition-all duration-300 min-w-[120px]"
        >
          <option value="">All Status</option>
          {taskStatuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>

        {/* Priority Filter */}
        <select
          value={filters.priority}
          onChange={(e) => handleFilterChange('priority', e.target.value)}
          className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl px-4 py-2 focus:ring-2 focus:ring-info/50 focus:border-info/50 transition-all duration-300 min-w-[120px]"
        >
          <option value="">All Priorities</option>
          {taskPriorities.map((priority) => (
            <option key={priority.value} value={priority.value}>
              {priority.icon} {priority.label}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="md"
            fullWidth={false}
            onClick={clearFilters}
            className="px-4"
          >
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
};

export default TaskFilters;
