import React from 'react';
import { Task } from '@/types/models';
import TaskCard from './TaskCard';
import TaskListItem from './TaskListItem';
import TaskCalendarView from './TaskCalendarView';
import { Search, Calendar, CheckSquare } from 'lucide-react';

interface TasksListProps {
  tasks: Task[];
  searchQuery: string;
  viewMode: 'grid' | 'list' | 'calendar';
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onCompleteTask: (taskId: string) => void;
  completingTask: string | null;
  setCompletingTask: (taskId: string | null) => void;
  deletingTask: string | null;
}

const TasksList: React.FC<TasksListProps> = ({
  tasks,
  searchQuery,
  viewMode,
  onEditTask,
  onDeleteTask,
  onCompleteTask,
  completingTask,
  setCompletingTask,
}) => {
  // Filter tasks based on search query
  const filteredTasks = tasks.filter((task) => {
    const query = searchQuery.toLowerCase();
    return (
      task.title.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query) ||
      task.location?.toLowerCase().includes(query) ||
      task.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  // Sort tasks by priority and date
  const sortedTasks = filteredTasks.sort((a, b) => {
    // First sort by priority
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const priorityDiff =
      (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) -
      (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);

    if (priorityDiff !== 0) return priorityDiff;

    // Then sort by scheduled date
    return (
      new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    );
  });

  if (filteredTasks.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-32 h-32 bg-gradient-to-br from-muted/30 to-muted/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          {searchQuery ? (
            <Search className="w-16 h-16 text-muted-foreground/50" />
          ) : (
            <CheckSquare className="w-16 h-16 text-muted-foreground/50" />
          )}
        </div>

        <h3 className="text-2xl font-bold text-muted-foreground mb-3">
          {searchQuery ? 'No tasks found' : 'No tasks yet'}
        </h3>

        <p className="text-muted-foreground/80 max-w-md mx-auto mb-8 leading-relaxed">
          {searchQuery
            ? `No tasks match your search "${searchQuery}". Try adjusting your search terms or filters.`
            : 'Ready to be productive? Create your first task and start making progress on your goals.'}
        </p>

        {searchQuery && (
          <div className="flex justify-center">
            <button
              onClick={() => window.history.back()}
              className="px-6 py-3 bg-gradient-to-r from-info to-primary text-primary-foreground rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
            >
              Clear Search
            </button>
          </div>
        )}
      </div>
    );
  }

  // Render based on view mode
  switch (viewMode) {
    case 'grid':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedTasks.map((task, index) => (
            <div
              key={task.id}
              className="animate-in slide-in-from-bottom duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <TaskCard
                task={task}
                onEdit={() => onEditTask(task)}
                onDelete={() => onDeleteTask(task.id)}
                onComplete={() => onCompleteTask(task.id)}
                isCompleting={completingTask === task.id}
                setCompletingTask={setCompletingTask}
              />
            </div>
          ))}
        </div>
      );

    case 'calendar':
      return (
        <TaskCalendarView
          tasks={sortedTasks}
          onEditTask={onEditTask}
          onDeleteTask={onDeleteTask}
          onCompleteTask={onCompleteTask}
          completingTask={completingTask}
          setCompletingTask={setCompletingTask}
        />
      );

    default: // list view
      return (
        <div className="space-y-4">
          {sortedTasks.map((task, index) => (
            <div
              key={task.id}
              className="animate-in slide-in-from-left duration-300"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <TaskListItem
                task={task}
                onEdit={() => onEditTask(task)}
                onDelete={() => onDeleteTask(task.id)}
                onComplete={() => onCompleteTask(task.id)}
                isCompleting={completingTask === task.id}
                setCompletingTask={setCompletingTask}
              />
            </div>
          ))}
        </div>
      );
  }
};

export default TasksList;
