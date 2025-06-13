import { storage } from '../storage';
import type { DbUser, DbDailyTask } from '../db';

export interface UserBehaviorPattern {
  userId: string;
  patternType: 'completion_time' | 'energy_level' | 'task_preference' | 'scheduling_habit';
  pattern: {
    timeSlots: Array<{
      hour: number;
      efficiency: number;
      taskTypes: string[];
    }>;
    preferences: {
      taskDuration: number;
      breakFrequency: number;
      priorityHandling: string;
    };
    habits: {
      planningTime: string;
      reviewTime: string;
      mostProductiveHours: string[];
    };
  };
  confidence: number;
  lastUpdated: Date;
}

export interface ProactiveSuggestion {
  id: string;
  userId: string;
  type: 'schedule_optimization' | 'task_creation' | 'goal_adjustment' | 'break_reminder' | 'energy_optimization';
  title: string;
  description: string;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high';
  context: Record<string, any>;
  validUntil: Date;
  confidence: number;
}

export class AmbientAIService {
  private learningIntervals = new Map<string, NodeJS.Timeout>();

  /**
   * Start ambient learning for a user
   */
  async startAmbientLearning(userId: string): Promise<void> {
    // Clear existing interval if any
    this.stopAmbientLearning(userId);

    // Set up periodic learning (every 4 hours)
    const interval = setInterval(async () => {
      await this.performAmbientLearning(userId);
    }, 4 * 60 * 60 * 1000); // 4 hours

    this.learningIntervals.set(userId, interval);

    // Perform initial learning
    await this.performAmbientLearning(userId);
  }

  /**
   * Stop ambient learning for a user
   */
  stopAmbientLearning(userId: string): void {
    const interval = this.learningIntervals.get(userId);
    if (interval) {
      clearInterval(interval);
      this.learningIntervals.delete(userId);
    }
  }

  /**
   * Perform ambient learning to update user patterns
   */
  private async performAmbientLearning(userId: string): Promise<void> {
    try {
      console.log(`🧠 Performing ambient learning for user ${userId}`);

      // Analyze completion patterns
      await this.analyzeCompletionPatterns(userId);

      // Analyze energy level patterns
      await this.analyzeEnergyPatterns(userId);

      // Analyze task preferences
      await this.analyzeTaskPreferences(userId);

      // Analyze scheduling habits
      await this.analyzeSchedulingHabits(userId);

      // Generate proactive suggestions
      await this.generateProactiveSuggestions(userId);

      console.log(`✅ Ambient learning completed for user ${userId}`);
    } catch (error) {
      console.error(`❌ Ambient learning failed for user ${userId}:`, error);
    }
  }

  /**
   * Analyze when user completes tasks most efficiently
   */
  private async analyzeCompletionPatterns(userId: string): Promise<void> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const completedTasks = await storage.tasks.getUserTasks(userId, thirtyDaysAgo, new Date());
    
    const completionsByHour: Record<number, { count: number; totalDuration: number; avgEfficiency: number }> = {};

    completedTasks
      .filter(task => task.status === 'completed' && task.scheduledTime)
      .forEach(task => {
        const hour = parseInt(task.scheduledTime!.split(':')[0]);
        const efficiency = this.calculateTaskEfficiency(task);

        if (!completionsByHour[hour]) {
          completionsByHour[hour] = { count: 0, totalDuration: 0, avgEfficiency: 0 };
        }

        completionsByHour[hour].count++;
        completionsByHour[hour].totalDuration += task.estimatedDuration;
        completionsByHour[hour].avgEfficiency = 
          (completionsByHour[hour].avgEfficiency * (completionsByHour[hour].count - 1) + efficiency) / 
          completionsByHour[hour].count;
      });

    // Convert to time slots with efficiency scores
    const timeSlots = Object.entries(completionsByHour)
      .map(([hour, data]) => ({
        hour: parseInt(hour),
        efficiency: data.avgEfficiency,
        taskTypes: this.getMostCommonTaskTypes(completedTasks, parseInt(hour)),
        completionCount: data.count
      }))
      .filter(slot => slot.completionCount >= 3) // Only consider slots with enough data
      .sort((a, b) => b.efficiency - a.efficiency);

    if (timeSlots.length > 0) {
      await storage.insights.createInsight({
        userId,
        insightType: 'optimal_work_hours',
        data: {
          timeSlots: timeSlots.slice(0, 5), // Top 5 most efficient hours
          peakHours: timeSlots.slice(0, 2).map(slot => `${slot.hour}:00`),
          analysisDate: new Date().toISOString(),
        },
        confidence: (timeSlots.length >= 5 ? 0.8 : 0.6).toString(),
      });
    }
  }

  /**
   * Analyze user's energy patterns based on task completion and timing
   */
  private async analyzeEnergyPatterns(userId: string): Promise<void> {
    const user = await storage.users.getUserById(userId);
    if (!user) return;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentTasks = await storage.tasks.getUserTasks(userId, sevenDaysAgo, new Date());

    const energyPatterns = {
      morning: { efficiency: 0, taskCount: 0 },    // 6-12
      afternoon: { efficiency: 0, taskCount: 0 },  // 12-18
      evening: { efficiency: 0, taskCount: 0 }     // 18-24
    };

    recentTasks
      .filter(task => task.status === 'completed' && task.scheduledTime)
      .forEach(task => {
        const hour = parseInt(task.scheduledTime!.split(':')[0]);
        const efficiency = this.calculateTaskEfficiency(task);
        let period: keyof typeof energyPatterns;

        if (hour >= 6 && hour < 12) period = 'morning';
        else if (hour >= 12 && hour < 18) period = 'afternoon';
        else period = 'evening';

        energyPatterns[period].efficiency = 
          (energyPatterns[period].efficiency * energyPatterns[period].taskCount + efficiency) / 
          (energyPatterns[period].taskCount + 1);
        energyPatterns[period].taskCount++;
      });

    // Determine energy levels based on efficiency
    const energyLevels = {
      morning: this.efficiencyToEnergyLevel(energyPatterns.morning.efficiency),
      afternoon: this.efficiencyToEnergyLevel(energyPatterns.afternoon.efficiency),
      evening: this.efficiencyToEnergyLevel(energyPatterns.evening.efficiency)
    };

    // Update user preferences if patterns are different
    const currentPrefs = user.preferences?.energyLevels;
    if (!currentPrefs || this.energyLevelsChanged(currentPrefs, energyLevels)) {
      await storage.users.updateUser(userId, {
        preferences: {
          ...user.preferences,
          energyLevels
        }
      });

      await storage.insights.createInsight({
        userId,
        insightType: 'optimal_work_hours',
        data: {
          energyPatterns,
          updatedEnergyLevels: energyLevels,
          analysisDate: new Date().toISOString(),
        },
        confidence: '0.7',
      });
    }
  }

  /**
   * Analyze user's task preferences and patterns
   */
  private async analyzeTaskPreferences(userId: string): Promise<void> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const tasks = await storage.tasks.getUserTasks(userId, thirtyDaysAgo, new Date());

    const preferences = {
      preferredDuration: this.calculatePreferredDuration(tasks),
      preferredPriorities: this.analyzePreferredPriorities(tasks),
      taskCompletionPatterns: this.analyzeTaskCompletionPatterns(tasks),
      procrastinationTendencies: this.analyzeProcrastinationTendencies(tasks)
    };

    await storage.insights.createInsight({
      userId,
      insightType: 'task_completion_pattern',
      data: preferences,
      confidence: (tasks.length >= 20 ? 0.8 : 0.6).toString(),
    });
  }

  /**
   * Analyze user's scheduling habits
   */
  private async analyzeSchedulingHabits(userId: string): Promise<void> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const tasks = await storage.tasks.getUserTasks(userId, thirtyDaysAgo, new Date());

    const habits = {
      planningFrequency: this.analyzePlanningFrequency(tasks),
      scheduleAdhereence: this.analyzeScheduleAdherence(tasks),
      bufferTimeUsage: this.analyzeBufferTimeUsage(tasks),
      breakPatterns: this.analyzeBreakPatterns(tasks)
    };

    await storage.insights.createInsight({
      userId,
      insightType: 'scheduling_preference',
      data: habits,
      confidence: '0.7'
    });
  }

  /**
   * Generate proactive suggestions based on learned patterns
   */
  async generateProactiveSuggestions(userId: string): Promise<ProactiveSuggestion[]> {
    const suggestions: ProactiveSuggestion[] = [];
    const insights = await storage.insights.getUserInsights(userId);
    const user = await storage.users.getUserById(userId);
    
    if (!user) return suggestions;

    // Analyze today's schedule for optimization opportunities
    const today = new Date();
    const todayTasks = await storage.tasks.getUserTasks(userId, today, today);

    // Suggestion 1: Schedule optimization
    const scheduleOptimization = await this.generateScheduleOptimizationSuggestion(userId, todayTasks, insights);
    if (scheduleOptimization) suggestions.push(scheduleOptimization);

    // Suggestion 2: Energy-based task rearrangement
    const energyOptimization = await this.generateEnergyOptimizationSuggestion(userId, todayTasks, user);
    if (energyOptimization) suggestions.push(energyOptimization);

    // Suggestion 3: Break reminders
    const breakReminder = await this.generateBreakReminderSuggestion(userId, todayTasks);
    if (breakReminder) suggestions.push(breakReminder);

    // Suggestion 4: Goal progress nudges
    const goalNudge = await this.generateGoalProgressSuggestion(userId);
    if (goalNudge) suggestions.push(goalNudge);

    // Suggestion 5: Task creation based on patterns
    const taskCreation = await this.generateTaskCreationSuggestion(userId, insights);
    if (taskCreation) suggestions.push(taskCreation);

    // Store suggestions in database
    for (const suggestion of suggestions) {
      await this.storeSuggestion(suggestion);
    }

    return suggestions;
  }

  /**
   * Get active suggestions for a user (renamed from getActiveProactiveSuggestions)
   */
  async getActiveSuggestions(userId: string): Promise<ProactiveSuggestion[]> {
    // This would be implemented when we have a suggestions table
    // For now, return recently generated suggestions
    const insights = await storage.insights.getUserInsights(userId);
    const suggestions: ProactiveSuggestion[] = [];

    // Extract suggestions from recent insights
    insights
      .filter(insight => {
        const data = insight.data as { suggestions?: ProactiveSuggestion[] };
        return data && Array.isArray(data.suggestions);
      })
      .forEach(insight => {
        const data = insight.data as { suggestions?: ProactiveSuggestion[] };
        if (Array.isArray(data.suggestions)) {
          suggestions.push(...data.suggestions);
        }
      });

    return suggestions.filter(s => new Date(s.validUntil) > new Date());
  }

  /**
   * Dismiss a suggestion
   */
  async dismissSuggestion(userId: string, suggestionId: string): Promise<boolean> {
    try {
      // Store the dismissal for learning purposes
      await storage.insights.createInsight({
        userId,
        insightType: 'suggestion_dismissed',
        data: {
          suggestionId,
          dismissedAt: new Date().toISOString(),
          reason: 'user_dismissed'
        },
        confidence: '1.0'
      });

      return true;
    } catch (error) {
      console.error('Error dismissing suggestion:', error);
      return false;
    }
  }

  /**
   * Apply a suggestion
   */
  async applySuggestion(userId: string, suggestionId: string): Promise<{ success: boolean; message: string }> {
    const suggestions = await this.getActiveSuggestions(userId);
    const suggestion = suggestions.find(s => s.id === suggestionId);

    if (!suggestion) {
      return { success: false, message: 'Suggestion not found or expired' };
    }

    try {
      switch (suggestion.type) {
        case 'schedule_optimization':
          return await this.applyScheduleOptimization(userId, suggestion);
        case 'task_creation':
          return await this.applyTaskCreation(userId, suggestion);
        case 'energy_optimization':
          return await this.applyEnergyOptimization(userId, suggestion);
        case 'break_reminder':
          return await this.applyBreakReminder(userId, suggestion);
        case 'goal_adjustment':
          return await this.applyGoalAdjustment(userId, suggestion);
        default:
          return { success: false, message: 'Unknown suggestion type' };
      }
    } catch (error) {
      const errorMessage = (error instanceof Error) ? error.message : String(error);
      return { success: false, message: `Failed to apply suggestion: ${errorMessage}` };
    }
  }

  // Private helper methods

  private calculateTaskEfficiency(task: DbDailyTask): number {
    // Simple efficiency calculation based on completion vs estimated duration
    // In a real implementation, you might track actual time spent
    const baseEfficiency = task.status === 'completed' ? 1.0 : 0.0;
    
    // Bonus for completing on time (if we had actual completion time)
    // For now, just use priority as a factor
    const priorityBonus = {
      'critical': 0.2,
      'high': 0.1,
      'medium': 0.0,
      'low': -0.1
    }[task.priority] || 0;

    return Math.max(0, Math.min(1, baseEfficiency + priorityBonus));
  }

  private getMostCommonTaskTypes(tasks: DbDailyTask[], hour: number): string[] {
    const hourTasks = tasks.filter(task => 
      task.scheduledTime && parseInt(task.scheduledTime.split(':')[0]) === hour
    );

    const tagCounts: Record<string, number> = {};
    hourTasks.forEach(task => {
      task.tags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([tag]) => tag);
  }

  private efficiencyToEnergyLevel(efficiency: number): 'low' | 'medium' | 'high' {
    if (efficiency >= 0.8) return 'high';
    if (efficiency >= 0.6) return 'medium';
    return 'low';
  }

  private energyLevelsChanged(current: any, new_levels: any): boolean {
    return (
      current.morning !== new_levels.morning ||
      current.afternoon !== new_levels.afternoon ||
      current.evening !== new_levels.evening
    );
  }

  private calculatePreferredDuration(tasks: DbDailyTask[]): number {
    const completedTasks = tasks.filter(t => t.status === 'completed');
    if (completedTasks.length === 0) return 30;

    const totalDuration = completedTasks.reduce((sum, task) => sum + task.estimatedDuration, 0);
    return Math.round(totalDuration / completedTasks.length);
  }

  private analyzePreferredPriorities(tasks: DbDailyTask[]): Record<string, number> {
    const priorityCounts = tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = tasks.length;
    const percentages: Record<string, number> = {};
    
    Object.entries(priorityCounts).forEach(([priority, count]) => {
      percentages[priority] = Math.round((count / total) * 100);
    });

    return percentages;
  }

  private analyzeTaskCompletionPatterns(tasks: DbDailyTask[]): any {
    const completed = tasks.filter(t => t.status === 'completed').length;
    const total = tasks.length;
    
    return {
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      avgTasksPerDay: this.calculateAvgTasksPerDay(tasks),
      completionTrend: this.calculateCompletionTrend(tasks)
    };
  }

  private analyzeProcrastinationTendencies(tasks: DbDailyTask[]): any {
    // Analyze patterns of task delays and rescheduling
    const overdueTasksCount = tasks.filter(task => {
      const scheduledDate = new Date(task.scheduledDate);
      const today = new Date();
      return scheduledDate < today && task.status === 'pending';
    }).length;

    return {
      overdueTasksPercentage: tasks.length > 0 ? Math.round((overdueTasksCount / tasks.length) * 100) : 0,
      procrastinationRisk: overdueTasksCount > tasks.length * 0.3 ? 'high' : 
                           overdueTasksCount > tasks.length * 0.1 ? 'medium' : 'low'
    };
  }

  private analyzePlanningFrequency(tasks: DbDailyTask[]): any {
    // Analyze how often user plans ahead
    const tasksWithFutureScheduling = tasks.filter(task => {
      const scheduledDate = new Date(task.scheduledDate);
      const createdDate = new Date(task.createdAt);
      const daysDifference = Math.floor((scheduledDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysDifference > 0;
    }).length;

    return {
      planningAheadPercentage: tasks.length > 0 ? Math.round((tasksWithFutureScheduling / tasks.length) * 100) : 0,
      planningStyle: tasksWithFutureScheduling > tasks.length * 0.7 ? 'proactive' : 
                     tasksWithFutureScheduling > tasks.length * 0.3 ? 'moderate' : 'reactive'
    };
  }

  private analyzeScheduleAdherence(tasks: DbDailyTask[]): any {
    const scheduledTasks = tasks.filter(t => t.scheduledTime);
    const completedOnTime = scheduledTasks.filter(t => t.status === 'completed').length;

    return {
      adherenceRate: scheduledTasks.length > 0 ? Math.round((completedOnTime / scheduledTasks.length) * 100) : 0,
      schedulingReliability: completedOnTime > scheduledTasks.length * 0.8 ? 'high' : 
                            completedOnTime > scheduledTasks.length * 0.6 ? 'medium' : 'low'
    };
  }

  private analyzeBufferTimeUsage(tasks: DbDailyTask[]): any {
    // Analyze if user leaves buffer time between tasks
    const scheduledTasks = tasks
      .filter(t => t.scheduledTime)
      .sort((a, b) => a.scheduledTime!.localeCompare(b.scheduledTime!));

    let totalGaps = 0;
    let gapCount = 0;

    for (let i = 0; i < scheduledTasks.length - 1; i++) {
      const currentEnd = this.addMinutesToTime(scheduledTasks[i].scheduledTime!, scheduledTasks[i].estimatedDuration);
      const nextStart = scheduledTasks[i + 1].scheduledTime!;
      const gap = this.calculateTimeDifference(currentEnd, nextStart);
      
      if (gap >= 0) {
        totalGaps += gap;
        gapCount++;
      }
    }

    return {
      avgBufferTime: gapCount > 0 ? Math.round(totalGaps / gapCount) : 0,
      bufferUsage: totalGaps > 0 ? 'uses_buffer' : 'tight_scheduling'
    };
  }

  private analyzeBreakPatterns(tasks: DbDailyTask[]): any {
    // Look for patterns in break-taking behavior
    const workingHours = 8 * 60; // 8 hours in minutes
    const totalTaskTime = tasks.reduce((sum, task) => sum + task.estimatedDuration, 0);
    const breakTime = Math.max(0, workingHours - totalTaskTime);

    return {
      breakTimePercentage: Math.round((breakTime / workingHours) * 100),
      breakTakingHabits: breakTime > workingHours * 0.2 ? 'good' : 
                        breakTime > workingHours * 0.1 ? 'moderate' : 'insufficient'
    };
  }

  private calculateAvgTasksPerDay(tasks: DbDailyTask[]): number {
    if (tasks.length === 0) return 0;

    const dates = new Set(tasks.map(task => new Date(task.scheduledDate).toDateString()));
    return Math.round(tasks.length / dates.size);
  }

  private calculateCompletionTrend(tasks: DbDailyTask[]): string {
    // Simple trend calculation based on recent vs older tasks
    const midpoint = Math.floor(tasks.length / 2);
    const recentTasks = tasks.slice(0, midpoint);
    const olderTasks = tasks.slice(midpoint);

    const recentCompletionRate = recentTasks.filter(t => t.status === 'completed').length / recentTasks.length;
    const olderCompletionRate = olderTasks.filter(t => t.status === 'completed').length / olderTasks.length;

    if (recentCompletionRate > olderCompletionRate + 0.1) return 'improving';
    if (recentCompletionRate < olderCompletionRate - 0.1) return 'declining';
    return 'stable';
  }

  private addMinutesToTime(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  }

  private calculateTimeDifference(time1: string, time2: string): number {
    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);
    const minutes1 = h1 * 60 + m1;
    const minutes2 = h2 * 60 + m2;
    return minutes2 - minutes1;
  }

  // Suggestion generation methods

  private async generateScheduleOptimizationSuggestion(
    userId: string, 
    tasks: DbDailyTask[], 
    insights: any[]
  ): Promise<ProactiveSuggestion | null> {
    const unscheduledTasks = tasks.filter(t => !t.scheduledTime && t.status === 'pending');
    
    if (unscheduledTasks.length === 0) return null;

    const optimalWorkHours = insights.find(i => i.insightType === 'optimal_work_hours');
    
    return {
      id: `schedule_opt_${Date.now()}`,
      userId,
      type: 'schedule_optimization',
      title: 'Optimize Your Schedule',
      description: `You have ${unscheduledTasks.length} unscheduled tasks. I can arrange them during your most productive hours.`,
      actionable: true,
      priority: 'medium',
      context: {
        unscheduledTaskIds: unscheduledTasks.map(t => t.id),
        optimalHours: optimalWorkHours?.data?.peakHours || []
      },
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      confidence: 0.8
    };
  }

  private async generateEnergyOptimizationSuggestion(
    userId: string, 
    tasks: DbDailyTask[], 
    user: DbUser
  ): Promise<ProactiveSuggestion | null> {
    if (!user.preferences?.energyLevels) return null;

    const { morning, afternoon, evening } = user.preferences.energyLevels;
    const highEnergyTasks = tasks.filter(t => t.priority === 'high' || t.priority === 'critical');
    
    // Check if high-priority tasks are scheduled during low energy periods
    const misalignedTasks = highEnergyTasks.filter(task => {
      if (!task.scheduledTime) return false;
      const hour = parseInt(task.scheduledTime.split(':')[0]);
      
      if (hour >= 6 && hour < 12 && morning === 'low') return true;
      if (hour >= 12 && hour < 18 && afternoon === 'low') return true;
      if (hour >= 18 && evening === 'low') return true;
      
      return false;
    });

    if (misalignedTasks.length === 0) return null;

    return {
      id: `energy_opt_${Date.now()}`,
      userId,
      type: 'energy_optimization',
      title: 'Align Tasks with Energy Levels',
      description: `${misalignedTasks.length} high-priority tasks are scheduled during your low-energy periods. Let me reschedule them.`,
      actionable: true,
      priority: 'high',
      context: {
        misalignedTaskIds: misalignedTasks.map(t => t.id),
        energyLevels: user.preferences.energyLevels
      },
      validUntil: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours
      confidence: 0.9
    };
  }

  private async generateBreakReminderSuggestion(
    userId: string, 
    tasks: DbDailyTask[]
  ): Promise<ProactiveSuggestion | null> {
    const scheduledTasks = tasks.filter(t => t.scheduledTime).sort((a, b) => 
      a.scheduledTime!.localeCompare(b.scheduledTime!)
    );

    if (scheduledTasks.length < 2) return null;

    // Check for consecutive long tasks without breaks
    let consecutiveTime = 0;
    let needsBreak = false;

    for (let i = 0; i < scheduledTasks.length - 1; i++) {
      const currentTask = scheduledTasks[i];
      const nextTask = scheduledTasks[i + 1];
      
      consecutiveTime += currentTask.estimatedDuration;
      
      const currentEnd = this.addMinutesToTime(currentTask.scheduledTime!, currentTask.estimatedDuration);
      const gap = this.calculateTimeDifference(currentEnd, nextTask.scheduledTime!);
      
      if (gap < 15 && consecutiveTime > 120) { // No break after 2+ hours
        needsBreak = true;
        break;
      } else if (gap >= 15) {
        consecutiveTime = 0; // Reset if there's a break
      }
    }

    if (!needsBreak) return null;

    return {
      id: `break_reminder_${Date.now()}`,
      userId,
      type: 'break_reminder',
      title: 'Schedule Break Time',
      description: 'You have long stretches of work without breaks. Regular breaks improve productivity and well-being.',
      actionable: true,
      priority: 'medium',
      context: {
        consecutiveHours: Math.round(consecutiveTime / 60),
        recommendedBreakDuration: 15
      },
      validUntil: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
      confidence: 0.7
    };
  }

  private async generateGoalProgressSuggestion(userId: string): Promise<ProactiveSuggestion | null> {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    const goals = await storage.goals.getUserGoals(userId, currentYear);
    const objectives = await storage.objectives.getUserObjectives(userId, currentMonth, currentYear);
    
    if (goals.length === 0) return null;

    // Find goals with low progress
    const lowProgressGoals = goals.filter(goal => {
      const relatedObjectives = objectives.filter(obj => obj.goalId === goal.id);
      const avgProgress = relatedObjectives.reduce((sum, obj) => sum + Number(obj.progress), 0) / relatedObjectives.length;
      return avgProgress < 30; // Less than 30% progress
    });

    if (lowProgressGoals.length === 0) return null;

    return {
      id: `goal_progress_${Date.now()}`,
      userId,
      type: 'goal_adjustment',
      title: 'Goal Progress Check-in',
      description: `${lowProgressGoals.length} of your goals need attention. Let's create some tasks to get back on track.`,
      actionable: true,
      priority: 'high',
      context: {
        lowProgressGoalIds: lowProgressGoals.map(g => g.id),
        currentMonth,
        suggestedActions: ['create_tasks', 'adjust_objectives', 'review_priorities']
      },
      validUntil: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
      confidence: 0.8
    };
  }

  private async generateTaskCreationSuggestion(
    userId: string, 
    insights: any[]
  ): Promise<ProactiveSuggestion | null> {
    const taskPatterns = insights.find(i => i.insightType === 'task_completion_pattern');
    
    if (!taskPatterns) return null;

    // Check if user typically does certain types of tasks on certain days
    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    // This is a simplified suggestion - in reality, you'd analyze patterns more deeply
    if (dayOfWeek === 'monday' && taskPatterns.data.planningStyle === 'proactive') {
      return {
        id: `task_creation_${Date.now()}`,
        userId,
        type: 'task_creation',
        title: 'Weekly Planning Reminder',
        description: 'Based on your patterns, Mondays are great for planning. Consider setting up tasks for the week.',
        actionable: true,
        priority: 'low',
        context: {
          suggestedTaskTypes: ['planning', 'review', 'goal_setting'],
          dayOfWeek
        },
        validUntil: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours
        confidence: 0.6
      };
    }

    return null;
  }

  private async storeSuggestion(suggestion: ProactiveSuggestion): Promise<void> {
    // Store in insights table for now
    await storage.insights.createInsight({
      userId: suggestion.userId,
      insightType: 'scheduling_preference', // Generic type for suggestions
      data: {
        suggestion,
        type: 'proactive_suggestion',
        generated: new Date().toISOString()
      },
      confidence: suggestion.confidence.toString()
    });
  }

  // Suggestion application methods

  private async applyScheduleOptimization(userId: string, suggestion: ProactiveSuggestion): Promise<{ success: boolean; message: string }> {
    const { unscheduledTaskIds, optimalHours } = suggestion.context;
    
    if (!Array.isArray(unscheduledTaskIds) || unscheduledTaskIds.length === 0) {
      return { success: false, message: 'No tasks to optimize' };
    }

    const optimizedTasks = [];
    for (const taskId of unscheduledTaskIds) {
      const task = await storage.tasks.getTaskById(taskId);
      if (task && task.userId === userId && !task.scheduledTime) {
        // Assign optimal time
        const suggestedTime = optimalHours && optimalHours.length > 0 ? optimalHours[0] : '09:00';
        
        const updatedTask = await storage.tasks.updateTask(taskId, {
          scheduledTime: suggestedTime
        });
        
        if (updatedTask) {
          optimizedTasks.push(updatedTask);
        }
      }
    }

    return {
      success: true,
      message: `Successfully scheduled ${optimizedTasks.length} tasks during your optimal hours`
    };
  }

  private async applyTaskCreation(userId: string, suggestion: ProactiveSuggestion): Promise<{ success: boolean; message: string }> {
    const { suggestedTaskTypes } = suggestion.context;
    
    // Create a planning task for Monday
    const task = await storage.tasks.createTask({
      userId,
      title: 'Weekly Planning Session',
      description: 'Review goals, plan tasks for the week, and set priorities',
      scheduledDate: new Date(),
      scheduledTime: '09:00',
      estimatedDuration: 30,
      priority: 'medium',
      tags: suggestedTaskTypes || ['planning']
    });

    return {
      success: true,
      message: 'Created a weekly planning task based on your patterns'
    };
  }

  private async applyEnergyOptimization(userId: string, suggestion: ProactiveSuggestion): Promise<{ success: boolean; message: string }> {
    const { misalignedTaskIds, energyLevels } = suggestion.context;
    
    // Find optimal time slots based on energy levels
    const optimalHours = [];
    if (energyLevels.morning === 'high') optimalHours.push('09:00', '10:00', '11:00');
    if (energyLevels.afternoon === 'high') optimalHours.push('14:00', '15:00', '16:00');
    if (energyLevels.evening === 'high') optimalHours.push('19:00', '20:00');

    const rescheduledTasks = [];
    for (let i = 0; i < misalignedTaskIds.length && i < optimalHours.length; i++) {
      const taskId = misalignedTaskIds[i];
      const task = await storage.tasks.getTaskById(taskId);
      
      if (task && task.userId === userId) {
        const updatedTask = await storage.tasks.updateTask(taskId, {
          scheduledTime: optimalHours[i]
        });
        
        if (updatedTask) {
          rescheduledTasks.push(updatedTask);
        }
      }
    }

    return {
      success: true,
      message: `Rescheduled ${rescheduledTasks.length} tasks to align with your energy levels`
    };
  }

  private async applyBreakReminder(userId: string, suggestion: ProactiveSuggestion): Promise<{ success: boolean; message: string }> {
    // Create break tasks
    const breakTask = await storage.tasks.createTask({
      userId,
      title: 'Take a Break',
      description: 'Step away from work, stretch, hydrate, or take a short walk',
      scheduledDate: new Date(),
      scheduledTime: '14:00', // Afternoon break
      estimatedDuration: suggestion.context.recommendedBreakDuration || 15,
      priority: 'low',
      tags: ['break', 'wellness']
    });

    return {
      success: true,
      message: 'Added break time to your schedule for better productivity'
    };
  }

  private async applyGoalAdjustment(userId: string, suggestion: ProactiveSuggestion): Promise<{ success: boolean; message: string }> {
    const { lowProgressGoalIds } = suggestion.context;
    
    // Create follow-up tasks for low-progress goals
    const createdTasks = [];
    for (const goalId of lowProgressGoalIds) {
      const goal = await storage.goals.getGoalById(goalId);
      if (goal && goal.userId === userId) {
        const reviewTask = await storage.tasks.createTask({
          userId,
          goalId,
          title: `Review Progress: ${goal.title}`,
          description: `Assess current progress and create action plan for goal: ${goal.title}`,
          scheduledDate: new Date(),
          estimatedDuration: 45,
          priority: 'high',
          tags: ['goal_review', 'planning']
        });
        
        if (reviewTask) {
          createdTasks.push(reviewTask);
        }
      }
    }

    return {
      success: true,
      message: `Created ${createdTasks.length} goal review tasks to get back on track`
    };
  }
}

// Export singleton instance
export const ambientAI = new AmbientAIService();