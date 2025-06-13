import React, { useState, useEffect } from 'react';
import {
  Edit3,
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  Tag,
  Bell,
} from 'lucide-react';
import { updateExistingTask, getAllGoals, getAllObjectives } from '@/utils/api';
import { Task, Goal, Objective } from '@/types/models';
import Modal, {
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import MessageDisplay from '@/components/ui/MessageDisplay';
import { taskPriorities, taskStatuses } from '@/types/tasks';

interface TaskEditModalProps {
  task: Task;
  onClose: () => void;
  onTaskUpdated: (task: Task) => void;
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
  status: string;
  tags: string;
  location: string;
  reminderMinutes: number;
}

const TaskEditModal: React.FC<TaskEditModalProps> = ({
  task,
  onClose,
  onTaskUpdated,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [filteredObjectives, setFilteredObjectives] = useState<Objective[]>([]);
  const [error, setError] = useState<string | null  >(null);

  const [formData, setFormData] = useState<TaskFormData>({
    objectiveId: task.objectiveId || '',
    goalId: task.goalId || '',
    title: task.title,
    description: task.description || '',
    scheduledDate: task.scheduledDate.split('T')[0],
    scheduledTime: task.scheduledTime || '',
    estimatedDuration: task.estimatedDuration || 30,
    priority: task.priority,
    status: task.status,
    tags: task.tags ? task.tags.join(', ') : '',
    location: task.location || '',
    reminderMinutes: task.reminderMinutes || 15,
  });

  useEffect(() => {
    fetchGoalsAndObjectives();
  }, []);

  useEffect(() => {
    if (formData.goalId) {
      setFilteredObjectives(
        objectives.filter((obj) => obj.goalId === formData.goalId)
      );
    } else {
      setFilteredObjectives(objectives);
    }
  }, [formData.goalId, objectives]);

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
    setError(null);

    try {
      setSubmitting(true);

      const taskData = {
        ...formData,
        objectiveId: formData.objectiveId || undefined,
        goalId: formData.goalId || undefined,
        scheduledTime: formData.scheduledTime || undefined,
        tags: formData.tags
          ? formData.tags.split(',').map((tag) => tag.trim())
          : [],
        location: formData.location || undefined,
        reminderMinutes:
          formData.reminderMinutes > 0 ? formData.reminderMinutes : undefined,
      };

      const response = await updateExistingTask(task.id, taskData);

      if (response.success) {
        // Emit event for dashboard refresh
        window.dispatchEvent(
          new CustomEvent('taskUpdated', {
            detail: { task: { ...task, ...taskData } },
          })
        );

        onClose();
        onTaskUpdated({ ...task, ...taskData });
      } else {
        setError(response.error || 'Failed to update task');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (
    field: keyof TaskFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

  return (
    <Modal isOpen={true} onClose={onClose} size="lg">
      {/* Header */}
      <ModalHeader
        title="Edit Task"
        subtitle="Update your task details"
        icon={<Edit3 className="w-6 h-6 text-white" />}
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

        <form id="task-edit-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Task Title */}
          <Input
            label="Task Title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Enter task title..."
            className="text-lg"
          />

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-3">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full bg-background/60 border border-border/50 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 resize-none text-foreground placeholder:text-muted-foreground"
              placeholder="Describe what needs to be done..."
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
            />

            <Input
              type="time"
              label="Scheduled Time (Optional)"
              leftIcon={<Clock className="w-4 h-4" />}
              value={formData.scheduledTime}
              onChange={(e) =>
                handleInputChange('scheduledTime', e.target.value)
              }
            />
          </div>

          {/* Duration, Priority, and Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                Priority Level
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full bg-background/60 border border-border/50 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
              >
                {taskPriorities.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.icon} {priority.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full bg-background/60 border border-border/50 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
              >
                {taskStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
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
            form="task-edit-form"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Update Task
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default TaskEditModal;
