import React, { useState, useEffect } from 'react';
import {
  Plus,
  CheckSquare,
  Calendar,
  Clock,
  MapPin,
  Tag,
  Bell,
  AlertCircle,
} from 'lucide-react';
import { createNewTask, getAllGoals, getAllObjectives } from '@/utils/api';
import { Task, Goal, Objective } from '@/types/models';
import Modal, {
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import MessageDisplay from '@/components/ui/MessageDisplay';
import { taskPriorities } from '@/types/tasks';

interface TaskCreateModalProps {
  onClose: () => void;
  onTaskCreated: (task: Task) => void;
}

interface TaskFormData {
  objectiveId: string;
  goalId: string;
  title: string;
  description: string;
  scheduledDate: string;
  scheduledTime: string;
  estimatedDuration: number;
  priority: string;
  tags: string;
  location: string;
  reminderMinutes: number;
}

interface ValidationErrors {
  [key: string]: string;
}

const TaskCreateModal: React.FC<TaskCreateModalProps> = ({
  onClose,
  onTaskCreated,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [filteredObjectives, setFilteredObjectives] = useState<Objective[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  const [formData, setFormData] = useState<TaskFormData>({
    objectiveId: '',
    goalId: '',
    title: '',
    description: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '',
    estimatedDuration: 30,
    priority: 'medium',
    tags: '',
    location: '',
    reminderMinutes: 15,
  });

  useEffect(() => {
    fetchGoalsAndObjectives();
  }, []);

  useEffect(() => {
    if (formData.goalId) {
      setFilteredObjectives(
        objectives.filter((obj) => obj.goalId === formData.goalId)
      );
      setFormData((prev) => ({ ...prev, objectiveId: '' }));
    } else {
      setFilteredObjectives(objectives);
    }
  }, [formData.goalId, objectives]);

  // Simplified validation - just check if required fields are empty
  const validateForm = (): ValidationErrors => {
    const errors: ValidationErrors = {};

    // Required fields validation - just check if empty
    if (!formData.title.trim()) {
      errors.title = 'Task title is required';
    }

    if (!formData.scheduledDate) {
      errors.scheduledDate = 'Scheduled date is required';
    }

    if (!formData.priority) {
      errors.priority = 'Priority is required';
    }

    return errors;
  };

  // Real-time validation
  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      const errors = validateForm();
      setValidationErrors(errors);
    }
  }, [formData, touched]);

  const fetchGoalsAndObjectives = async () => {
    try {
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
    } catch (err: any) {
      setError('Failed to load goals and objectives');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    const allFields = Object.keys(formData);
    setTouched(
      allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {})
    );

    // Validate form
    const errors = validateForm();
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        scheduledDate: formData.scheduledDate,
        scheduledTime: formData.scheduledTime || undefined,
        estimatedDuration: formData.estimatedDuration,
        priority: formData.priority,
        tags: formData.tags
          ? formData.tags
              .split(',')
              .map((tag) => tag.trim())
              .filter((tag) => tag.length > 0)
          : undefined,
        location: formData.location.trim() || undefined,
        reminderMinutes: formData.reminderMinutes || undefined,
        objectiveId: formData.objectiveId || undefined,
        goalId: formData.goalId || undefined,
      };

      const response = await createNewTask(taskData);

      if (response.success) {
        // Emit event for dashboard refresh
        window.dispatchEvent(
          new CustomEvent('taskCreated', {
            detail: { task: response.data?.task },
          })
        );

        onClose();
        if (onTaskCreated && response.data?.task) {
          onTaskCreated(response.data.task);
        }
      } else {
        setError(response.error || 'Failed to create task');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
      console.error('Create task error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (
    field: keyof TaskFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const getFieldError = (field: string) => {
    return touched[field] ? validationErrors[field] : undefined;
  };

  const reminderOptions = [
    { value: 0, label: 'No reminder' },
    { value: 5, label: '5 minutes before' },
    { value: 15, label: '15 minutes before' },
    { value: 30, label: '30 minutes before' },
    { value: 60, label: '1 hour before' },
    { value: 1440, label: '1 day before' },
  ];

  const durationOptions = [
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' },
    { value: 180, label: '3 hours' },
    { value: 240, label: '4 hours' },
  ];

  const isFormValid = Object.keys(validateForm()).length === 0;

  return (
    <Modal isOpen={true} onClose={onClose} size="lg">
      {/* Header */}
      <ModalHeader
        title="Create New Task"
        subtitle="Break down your objectives into actionable tasks"
        icon={<Plus className="w-6 h-6 text-white" />}
        onClose={onClose}
      />

      {/* Body */}
      <ModalBody className="max-h-[60vh]">
        {error && (
          <MessageDisplay
            message={error}
            type="error"
            dismissible
            onDismiss={() => setError(null)}
            className="mb-6"
          />
        )}

        <form id="task-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Task Title */}
          <Input
            label="Task Title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            onBlur={() => handleBlur('title')}
            placeholder="e.g., Complete React component design, Review project proposal..."
            error={getFieldError('title')}
            className="text-lg"
            helperText="* Required field"
          />

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-3">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              onBlur={() => handleBlur('description')}
              className="w-full bg-background/60 border border-border/50 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 text-foreground placeholder:text-muted-foreground resize-none"
              placeholder="Describe what needs to be done in detail..."
              rows={3}
            />
          </div>

          {/* Goal and Objective Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">
                Related Goal (Optional)
              </label>
              <select
                value={formData.goalId}
                onChange={(e) => handleInputChange('goalId', e.target.value)}
                className="w-full bg-background/60 border border-border/50 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
              >
                <option value="">Select a goal</option>
                {goals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">
                Related Objective (Optional)
              </label>
              <select
                value={formData.objectiveId}
                onChange={(e) =>
                  handleInputChange('objectiveId', e.target.value)
                }
                className="w-full bg-background/60 border border-border/50 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                disabled={!formData.goalId && filteredObjectives.length === 0}
              >
                <option value="">Select an objective</option>
                {filteredObjectives.map((objective) => (
                  <option key={objective.id} value={objective.id}>
                    {objective.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              type="date"
              label="Scheduled Date"
              leftIcon={<Calendar className="w-4 h-4" />}
              value={formData.scheduledDate}
              onChange={(e) =>
                handleInputChange('scheduledDate', e.target.value)
              }
              onBlur={() => handleBlur('scheduledDate')}
              error={getFieldError('scheduledDate')}
              helperText="* Required field"
            />

            <Input
              type="time"
              label="Scheduled Time (Optional)"
              leftIcon={<Clock className="w-4 h-4" />}
              value={formData.scheduledTime}
              onChange={(e) =>
                handleInputChange('scheduledTime', e.target.value)
              }
              onBlur={() => handleBlur('scheduledTime')}
            />
          </div>

          {/* Duration and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">
                Estimated Duration
              </label>
              <select
                value={formData.estimatedDuration}
                onChange={(e) =>
                  handleInputChange(
                    'estimatedDuration',
                    parseInt(e.target.value)
                  )
                }
                className="w-full bg-background/60 border border-border/50 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
              >
                {durationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">
                Priority Level <span className="text-destructive">*</span>
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                onBlur={() => handleBlur('priority')}
                className={`w-full bg-background/60 border rounded-lg px-4 py-3 focus:ring-2 transition-all duration-300 ${
                  getFieldError('priority')
                    ? 'border-destructive/50 focus:border-destructive/50 focus:ring-destructive/20'
                    : 'border-border/50 focus:border-primary focus:ring-primary/20'
                }`}
              >
                <option value="">Select priority</option>
                {taskPriorities.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.icon} {priority.label}
                  </option>
                ))}
              </select>
              {getFieldError('priority') && (
                <p className="mt-2 text-sm text-destructive flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {getFieldError('priority')}
                </p>
              )}
            </div>
          </div>

          {/* Location and Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Location (Optional)"
              leftIcon={<MapPin className="w-4 h-4" />}
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="e.g., Home Office, Coffee Shop, Library..."
            />

            <Input
              label="Tags (Optional)"
              leftIcon={<Tag className="w-4 h-4" />}
              value={formData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
              placeholder="e.g., learning, urgent, meeting (comma separated)"
            />
          </div>

          {/* Reminder */}
          <div>
            <label className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              Reminder
            </label>
            <select
              value={formData.reminderMinutes}
              onChange={(e) =>
                handleInputChange('reminderMinutes', parseInt(e.target.value))
              }
              className="w-full bg-background/60 border border-border/50 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
            >
              {reminderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </form>
      </ModalBody>

      {/* Footer */}
      <ModalFooter>
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            size="lg"
            fullWidth={false}
            onClick={onClose}
            disabled={submitting}
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
            form="task-form"
            disabled={!isFormValid}
          >
            <CheckSquare className="w-5 h-5 mr-2" />
            Create Task
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default TaskCreateModal;
