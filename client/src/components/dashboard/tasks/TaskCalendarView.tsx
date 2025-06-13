import React, { useState } from 'react';
import { Task } from '@/types/models';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import TaskCard from './TaskCard';

interface TaskCalendarViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onCompleteTask: (taskId: string) => void;
  completingTask: string | null;
  setCompletingTask: (taskId: string | null) => void;
}

const TaskCalendarView: React.FC<TaskCalendarViewProps> = ({
  tasks,
  onEditTask,
  onDeleteTask,
  onCompleteTask,
  completingTask,
  setCompletingTask,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthNames = [
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

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getTasksForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return tasks.filter(
      (task) => task.scheduledDate.split('T')[0] === dateString
    );
  };

  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-4">
        {/* Day Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="text-center font-medium text-muted-foreground p-2"
          >
            {day}
          </div>
        ))}

        {/* Empty days from previous month */}
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="h-32"></div>
        ))}

        {/* Days with tasks */}
        {days.map((day) => {
          const date = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            day
          );
          const dayTasks = getTasksForDate(date);
          const isToday = new Date().toDateString() === date.toDateString();

          return (
            <div
              key={day}
              className={`min-h-[120px] border border-border/30 rounded-lg p-2 ${
                isToday ? 'bg-info/10 border-info/30' : 'bg-background/50'
              }`}
            >
              <div
                className={`text-sm font-medium mb-2 ${
                  isToday ? 'text-info' : 'text-muted-foreground'
                }`}
              >
                {day}
              </div>

              <div className="space-y-1">
                {dayTasks.slice(0, 2).map((task) => (
                  <div
                    key={task.id}
                    className="bg-card/60 border border-border/30 rounded p-2 text-xs hover:shadow-md transition-all duration-200 cursor-pointer"
                    onClick={() => onEditTask(task)}
                  >
                    <div className="font-medium text-foreground truncate mb-1">
                      {task.title}
                    </div>
                    {task.scheduledTime && (
                      <div className="text-muted-foreground">
                        {task.scheduledTime}
                      </div>
                    )}
                  </div>
                ))}

                {dayTasks.length > 2 && (
                  <div className="text-xs text-muted-foreground text-center py-1">
                    +{dayTasks.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tasks for selected date (if any) */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          All Tasks This Month
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={() => onEditTask(task)}
              onDelete={() => onDeleteTask(task.id)}
              onComplete={() => onCompleteTask(task.id)}
              isCompleting={completingTask === task.id}
              setCompletingTask={setCompletingTask}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TaskCalendarView;
