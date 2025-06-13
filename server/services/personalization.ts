import { storage } from '../storage';
import type { DbUser, DbDailyTask, DbGoal } from '../db';

export interface PersonalizationProfile {
  userId: string;
  workStyle: 'focused' | 'flexible' | 'structured' | 'creative';
  energyPattern: 'early_bird' | 'night_owl' | 'consistent' | 'variable';
  priorityStyle: 'deadline_driven' | 'importance_first' | 'balanced' | 'reactive';
  planningStyle: 'detailed' | 'high_level' | 'adaptive' | 'minimal';
  productivityFactors: {
    optimalTaskDuration: number;
    breakFrequency: number;
    focusBlocks: number;
    multitaskingTolerance: 'low' | 'medium' | 'high';
  };
  preferences: {
    morningRoutine: boolean;
    eveningReview: boolean;
    weeklyPlanning: boolean;
    bufferTime: number;
  };
  lastUpdated: Date;
}

export class PersonalizationEngine {
  
  /**
   * Analyze user behavior and create/update personalization profile
   */
  async analyzeUserPersonalization(userId: string): Promise<PersonalizationProfile> {
    const user = await storage.users.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get historical data for analysis
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const tasks = await storage.tasks.getUserTasks(userId, thirtyDaysAgo, new Date());
    const goals = await storage.goals.getUserGoals(userId);
    const insights = await storage.insights.getUserInsights(userId);

    // Analyze work style
    const workStyle = this.determineWorkStyle(tasks, insights);
    
    // Analyze energy patterns
    const energyPattern = this.determineEnergyPattern(tasks, user);
    
    // Analyze priority handling style
    const priorityStyle = this.determinePriorityStyle(tasks);
    
    // Analyze planning style
    const planningStyle = this.determinePlanningStyle(tasks, goals);
    
    // Calculate productivity factors
    const productivityFactors = this.calculateProductivityFactors(tasks);
    
    // Determine preferences
    const preferences = this.determinePreferences(tasks, insights);

    const profile: PersonalizationProfile = {
      userId,
      workStyle,
      energyPattern,
      priorityStyle,
      planningStyle,
      productivityFactors,
      preferences,
      lastUpdated: new Date()
    };

    // Store the profile
    await this.storePersonalizationProfile(profile);

    return profile;
  }

  /**
   * Get personalized task recommendations based on user profile
   */
  async getPersonalizedTaskRecommendations(userId: string, date: Date): Promise<{
    schedulingRecommendations: any[];
    taskOptimizations: any[];
    workflowSuggestions: any[];
  }> {
    const profile = await this.getPersonalizationProfile(userId);
    if (!profile) {
      throw new Error('Personalization profile not found');
    }

    const dayTasks = await storage.tasks.getUserTasks(userId, date, date);
    
    return {
      schedulingRecommendations: this.generateSchedulingRecommendations(profile, dayTasks),
      taskOptimizations: this.generateTaskOptimizations(profile, dayTasks),
      workflowSuggestions: this.generateWorkflowSuggestions(profile, dayTasks)
    };
  }

  /**
   * Personalize goal decomposition based on user patterns
   */
  async personalizeGoalDecomposition(userId: string, goal: any): Promise<{
    decompositionStrategy: string;
    timelineAdjustments: any[];
    motivationalFactors: string[];
  }> {
    const profile = await this.getPersonalizationProfile(userId);
    if (!profile) {
      throw new Error('Personalization profile not found');
    }

    const strategy = this.determineDecompositionStrategy(profile, goal);
    const adjustments = this.generateTimelineAdjustments(profile, goal);
    const motivationalFactors = this.identifyMotivationalFactors(profile, goal);

    return {
      decompositionStrategy: strategy,
      timelineAdjustments: adjustments,
      motivationalFactors
    };
  }

  // Private analysis methods

  private determineWorkStyle(tasks: DbDailyTask[], insights: any[]): PersonalizationProfile['workStyle'] {
    const taskDurations = tasks.map(t => t.estimatedDuration);
    const avgDuration = taskDurations.reduce((sum, d) => sum + d, 0) / taskDurations.length;
    
    const hasLongFocusBlocks = taskDurations.some(d => d > 90);
    const hasShortTasks = taskDurations.some(d => d < 30);
    const varianceInDuration = this.calculateVariance(taskDurations);

    if (hasLongFocusBlocks && avgDuration > 60) return 'focused';
    if (varianceInDuration > 1000) return 'flexible';
    if (avgDuration < 45 && !hasLongFocusBlocks) return 'structured';
    return 'creative';
  }

  private determineEnergyPattern(tasks: DbDailyTask[], user: DbUser): PersonalizationProfile['energyPattern'] {
    const energyLevels = user.preferences?.energyLevels;
    if (!energyLevels) return 'consistent';

    const { morning, afternoon, evening } = energyLevels;
    
    if (morning === 'high' && afternoon === 'medium' && evening === 'low') return 'early_bird';
    if (morning === 'low' && afternoon === 'medium' && evening === 'high') return 'night_owl';
    if (morning === afternoon && afternoon === evening) return 'consistent';
    return 'variable';
  }

  private determinePriorityStyle(tasks: DbDailyTask[]): PersonalizationProfile['priorityStyle'] {
    const completedTasks = tasks.filter(t => t.status === 'completed');
    
    const priorityCompletionRates = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    Object.keys(priorityCompletionRates).forEach(priority => {
      const totalWithPriority = tasks.filter(t => t.priority === priority).length;
      const completedWithPriority = completedTasks.filter(t => t.priority === priority).length;
      priorityCompletionRates[priority] = totalWithPriority > 0 ? completedWithPriority / totalWithPriority : 0;
    });

    if (priorityCompletionRates.critical > 0.8 && priorityCompletionRates.high > 0.7) return 'importance_first';
    if (priorityCompletionRates.low > priorityCompletionRates.high) return 'reactive';
    if (Math.abs(priorityCompletionRates.high - priorityCompletionRates.medium) < 0.2) return 'balanced';
    return 'deadline_driven';
  }

  private determinePlanningStyle(tasks: DbDailyTask[], goals: DbGoal[]): PersonalizationProfile['planningStyle'] {
    const totalTasks = tasks.length;
    const tasksWithDetailedInfo = tasks.filter(t => 
      t.description && t.description.length > 50 && t.estimatedDuration > 0
    ).length;

    const detailRatio = totalTasks > 0 ? tasksWithDetailedInfo / totalTasks : 0;
    
    const tasksWithFutureScheduling = tasks.filter(task => {
      const scheduledDate = new Date(task.scheduledDate);
      const createdDate = new Date(task.createdAt);
      return scheduledDate > createdDate;
    }).length;

    const planningAheadRatio = totalTasks > 0 ? tasksWithFutureScheduling / totalTasks : 0;

    if (detailRatio > 0.7 && planningAheadRatio > 0.6) return 'detailed';
    if (detailRatio < 0.3 && planningAheadRatio < 0.3) return 'minimal';
    if (planningAheadRatio > 0.5) return 'adaptive';
    return 'high_level';
  }

  private calculateProductivityFactors(tasks: DbDailyTask[]): PersonalizationProfile['productivityFactors'] {
    const completedTasks = tasks.filter(t => t.status === 'completed');
    
    const durations = completedTasks.map(t => t.estimatedDuration);
    const optimalTaskDuration = durations.length > 0 ? 
      durations.reduce((sum, d) => sum + d, 0) / durations.length : 30;

    // Calculate focus blocks (tasks > 60 minutes)
    const focusBlocks = completedTasks.filter(t => t.estimatedDuration > 60).length;
    
    // Estimate break frequency based on task spacing
    const scheduledTasks = completedTasks
      .filter(t => t.scheduledTime)
      .sort((a, b) => a.scheduledTime!.localeCompare(b.scheduledTime!));

    let breakCount = 0;
    for (let i = 0; i < scheduledTasks.length - 1; i++) {
      const currentEnd = this.addMinutesToTime(
        scheduledTasks[i].scheduledTime!, 
        scheduledTasks[i].estimatedDuration
      );
      const nextStart = scheduledTasks[i + 1].scheduledTime!;
      const gap = this.calculateTimeDifference(currentEnd, nextStart);
      
      if (gap >= 15) breakCount++; // 15+ minute gap considered a break
    }

    const breakFrequency = scheduledTasks.length > 1 ? 
      Math.round((breakCount / (scheduledTasks.length - 1)) * 100) : 50;

    // Estimate multitasking tolerance based on task switching patterns
    const multitaskingTolerance = this.estimateMultitaskingTolerance(tasks);

    return {
      optimalTaskDuration: Math.round(optimalTaskDuration),
      breakFrequency,
      focusBlocks,
      multitaskingTolerance
    };
  }

  private determinePreferences(tasks: DbDailyTask[], insights: any[]): PersonalizationProfile['preferences'] {
    // Analyze patterns to determine preferences
    const morningTasks = tasks.filter(task => {
      if (!task.scheduledTime) return false;
      const hour = parseInt(task.scheduledTime.split(':')[0]);
      return hour >= 6 && hour < 10;
    });

    const eveningTasks = tasks.filter(task => {
      if (!task.scheduledTime) return false;
      const hour = parseInt(task.scheduledTime.split(':')[0]);
      return hour >= 18 && hour < 22;
    });

    const hasRoutineTasks = tasks.some(task => 
      task.title.toLowerCase().includes('routine') ||
      task.title.toLowerCase().includes('review') ||
      task.tags?.includes('routine')
    );

    const scheduledTasks = tasks.filter(t => t.scheduledTime);
    const avgBufferTime = this.calculateAverageBufferTime(scheduledTasks);

    return {
      morningRoutine: morningTasks.length > tasks.length * 0.2,
      eveningReview: eveningTasks.length > 0 && hasRoutineTasks,
      weeklyPlanning: hasRoutineTasks,
      bufferTime: avgBufferTime
    };
  }

  // Recommendation generation methods

  private generateSchedulingRecommendations(
    profile: PersonalizationProfile, 
    tasks: DbDailyTask[]
  ): any[] {
    const recommendations = [];

    // Energy-based scheduling
    if (profile.energyPattern === 'early_bird') {
      const highPriorityTasks = tasks.filter(t => t.priority === 'high' || t.priority === 'critical');
      const morningTasks = highPriorityTasks.filter(t => {
        if (!t.scheduledTime) return false;
        const hour = parseInt(t.scheduledTime.split(':')[0]);
        return hour >= 6 && hour < 12;
      });

      if (morningTasks.length < highPriorityTasks.length * 0.7) {
        recommendations.push({
          type: 'energy_alignment',
          title: 'Schedule High-Priority Tasks in Morning',
          description: 'Based on your early bird pattern, schedule important tasks between 8-11 AM',
          impact: 'high',
          effort: 'low'
        });
      }
    }

    // Work style recommendations
    if (profile.workStyle === 'focused') {
      const longTasks = tasks.filter(t => t.estimatedDuration > 90);
      if (longTasks.length === 0) {
        recommendations.push({
          type: 'task_batching',
          title: 'Create Focus Blocks',
          description: 'Combine smaller tasks into 90+ minute focus blocks for better productivity',
          impact: 'medium',
          effort: 'medium'
        });
      }
    }

    return recommendations;
  }

  private generateTaskOptimizations(
    profile: PersonalizationProfile, 
    tasks: DbDailyTask[]
  ): any[] {
    const optimizations = [];

    // Duration optimization
    const avgDuration = tasks.reduce((sum, t) => sum + t.estimatedDuration, 0) / tasks.length;
    if (Math.abs(avgDuration - profile.productivityFactors.optimalTaskDuration) > 15) {
      optimizations.push({
        type: 'duration_optimization',
        title: 'Adjust Task Durations',
        description: `Your optimal task duration is ${profile.productivityFactors.optimalTaskDuration} minutes, but current average is ${Math.round(avgDuration)} minutes`,
        impact: 'medium',
        effort: 'low'
      });
    }

    // Break optimization
    const scheduledTasks = tasks.filter(t => t.scheduledTime);
    const currentBreaks = this.countBreaks(scheduledTasks);
    const optimalBreaks = Math.ceil(scheduledTasks.length * (profile.productivityFactors.breakFrequency / 100));

    if (currentBreaks < optimalBreaks) {
      optimizations.push({
        type: 'break_optimization',
        title: 'Add More Breaks',
        description: `Add ${optimalBreaks - currentBreaks} more breaks based on your productivity pattern`,
        impact: 'high',
        effort: 'low'
      });
    }

    return optimizations;
  }

  private generateWorkflowSuggestions(
    profile: PersonalizationProfile, 
    tasks: DbDailyTask[]
  ): any[] {
    const suggestions = [];

    // Planning style suggestions
    if (profile.planningStyle === 'detailed' && profile.preferences.weeklyPlanning) {
      suggestions.push({
        type: 'weekly_planning',
        title: 'Weekly Planning Session',
        description: 'Schedule a dedicated time for weekly planning to maintain your detailed approach',
        impact: 'high',
        effort: 'medium'
      });
    }

    // Work style workflow suggestions
    if (profile.workStyle === 'structured' && profile.productivityFactors.multitaskingTolerance === 'low') {
      suggestions.push({
        type: 'single_tasking',
        title: 'Single-Task Focus',
        description: 'Schedule one task at a time with clear boundaries to match your structured style',
        impact: 'medium',
        effort: 'low'
      });
    }

    return suggestions;
  }

  /**
   * Counts the number of breaks (15+ minute gaps) between scheduled tasks.
   */
  private countBreaks(scheduledTasks: DbDailyTask[]): number {
    if (scheduledTasks.length < 2) return 0;
    // Sort tasks by scheduledTime
    const sorted = scheduledTasks.slice().sort((a, b) => a.scheduledTime!.localeCompare(b.scheduledTime!));
    let breakCount = 0;
    for (let i = 0; i < sorted.length - 1; i++) {
      const currentEnd = this.addMinutesToTime(sorted[i].scheduledTime!, sorted[i].estimatedDuration);
      const nextStart = sorted[i + 1].scheduledTime!;
      const gap = this.calculateTimeDifference(currentEnd, nextStart);
      if (gap >= 15) breakCount++;
    }
    return breakCount;
  }

  // Strategy determination methods

  private determineDecompositionStrategy(profile: PersonalizationProfile, goal: any): string {
    const { workStyle, planningStyle, energyPattern } = profile;
    
    if (planningStyle === 'detailed' && workStyle === 'structured') {
      return 'milestone_driven';
    } else if (workStyle === 'flexible' && energyPattern === 'variable') {
      return 'adaptive_incremental';
    } else if (workStyle === 'focused' && planningStyle === 'high_level') {
      return 'sprint_based';
    } else if (planningStyle === 'minimal') {
      return 'outcome_focused';
    }
    
    return 'balanced_progressive';
  }

  private generateTimelineAdjustments(profile: PersonalizationProfile, goal: any): any[] {
    const adjustments = [];
    
    // Adjust based on work style
    if (profile.workStyle === 'focused') {
      adjustments.push({
        type: 'concentration_blocks',
        description: 'Allocate longer time blocks for deep work tasks',
        adjustment: 'Increase task durations by 25% for complex objectives'
      });
    }
    
    // Adjust based on energy pattern
    if (profile.energyPattern === 'early_bird') {
      adjustments.push({
        type: 'timing_optimization',
        description: 'Schedule critical milestones in morning hours',
        adjustment: 'Front-load important deadlines to morning schedules'
      });
    }
    
    // Adjust based on productivity factors
    if (profile.productivityFactors.breakFrequency > 70) {
      adjustments.push({
        type: 'pacing_adjustment',
        description: 'Add buffer time between major milestones',
        adjustment: 'Increase timeline by 15% to accommodate preferred break patterns'
      });
    }
    
    return adjustments;
  }

  private identifyMotivationalFactors(profile: PersonalizationProfile, goal: any): string[] {
    const factors = [];
    
    // Based on priority style
    switch (profile.priorityStyle) {
      case 'importance_first':
        factors.push('Clear impact metrics', 'Progress visibility');
        break;
      case 'deadline_driven':
        factors.push('Time-bound milestones', 'Urgency reminders');
        break;
      case 'balanced':
        factors.push('Flexible deadlines', 'Multiple success metrics');
        break;
      case 'reactive':
        factors.push('Quick wins', 'Immediate feedback');
        break;
    }
    
    // Based on planning style
    switch (profile.planningStyle) {
      case 'detailed':
        factors.push('Step-by-step guides', 'Detailed tracking');
        break;
      case 'minimal':
        factors.push('Simple checkpoints', 'Outcome focus');
        break;
      case 'adaptive':
        factors.push('Flexible milestones', 'Course correction opportunities');
        break;
    }
    
    return factors;
  }

  private estimateMultitaskingTolerance(tasks: DbDailyTask[]): 'low' | 'medium' | 'high' {
    const scheduledTasks = tasks.filter(t => t.scheduledTime);
    if (scheduledTasks.length < 3) return 'medium';
    
    // Sort by scheduled time
    const sorted = scheduledTasks.sort((a, b) => a.scheduledTime!.localeCompare(b.scheduledTime!));
    
    let overlappingTasks = 0;
    let rapidSwitches = 0;
    
    for (let i = 0; i < sorted.length - 1; i++) {
      const currentEnd = this.addMinutesToTime(sorted[i].scheduledTime!, sorted[i].estimatedDuration);
      const nextStart = sorted[i + 1].scheduledTime!;
      const gap = this.calculateTimeDifference(currentEnd, nextStart);
      
      if (gap < 0) overlappingTasks++; // Overlapping tasks
      if (gap < 15 && gap >= 0) rapidSwitches++; // Quick switches
    }
    
    const overlapRatio = overlappingTasks / (sorted.length - 1);
    const switchRatio = rapidSwitches / (sorted.length - 1);
    
    if (overlapRatio > 0.3 || switchRatio > 0.5) return 'high';
    if (overlapRatio > 0.1 || switchRatio > 0.2) return 'medium';
    return 'low';
  }

  private calculateAverageBufferTime(scheduledTasks: DbDailyTask[]): number {
    if (scheduledTasks.length < 2) return 15; // Default 15 minutes
    
    const sorted = scheduledTasks.sort((a, b) => a.scheduledTime!.localeCompare(b.scheduledTime!));
    let totalGaps = 0;
    let gapCount = 0;
    
    for (let i = 0; i < sorted.length - 1; i++) {
      const currentEnd = this.addMinutesToTime(sorted[i].scheduledTime!, sorted[i].estimatedDuration);
      const nextStart = sorted[i + 1].scheduledTime!;
      const gap = this.calculateTimeDifference(currentEnd, nextStart);
      
      if (gap > 0 && gap < 120) { // Only count reasonable gaps
        totalGaps += gap;
        gapCount++;
      }
    }
    
    return gapCount > 0 ? Math.round(totalGaps / gapCount) : 15;
  }

  private calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
  }

  // Utility methods for time calculations

  private addMinutesToTime(timeStr: string, minutes: number): string {
    const [hours, mins] = timeStr.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  }

  private calculateTimeDifference(startTime: string, endTime: string): number {
    const [startHours, startMins] = startTime.split(':').map(Number);
    const [endHours, endMins] = endTime.split(':').map(Number);
    
    const startTotalMins = startHours * 60 + startMins;
    const endTotalMins = endHours * 60 + endMins;
    
    return endTotalMins - startTotalMins;
  }

  // Database operations

  private async storePersonalizationProfile(profile: PersonalizationProfile): Promise<void> {
    // Store in insights table as a special insight type
    await storage.insights.createInsight({
      userId: profile.userId,
      insightType: 'personalization_profile',
      data: profile,
      confidence: 0.9,
    });
  }

  private async getPersonalizationProfile(userId: string): Promise<PersonalizationProfile | null> {
    const insights = await storage.insights.getUserInsights(userId, 'personalization_profile');
    
    if (insights.length === 0) {
      // Generate new profile if none exists
      return await this.analyzeUserPersonalization(userId);
    }
    
    // Return the most recent profile
    const latestInsight = insights[0];
    return latestInsight.data as PersonalizationProfile;
  }

  /**
   * Generate real-time personalized suggestions based on current context
   */
  async generateContextualSuggestions(userId: string, context: {
    currentTime: Date;
    location?: string;
    recentActivity?: string;
    energyLevel?: 'low' | 'medium' | 'high';
  }): Promise<{
    immediate: any[];
    upcoming: any[];
    strategic: any[];
  }> {
    const profile = await this.getPersonalizationProfile(userId);
    if (!profile) {
      throw new Error('Personalization profile not found');
    }

    const currentHour = context.currentTime.getHours();
    const today = new Date(context.currentTime);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTasks = await storage.tasks.getUserTasks(userId, today, tomorrow);
    const upcomingTasks = todayTasks.filter(task => {
      if (!task.scheduledTime) return false;
      const taskHour = parseInt(task.scheduledTime.split(':')[0]);
      return taskHour >= currentHour && task.status === 'pending';
    });

    return {
      immediate: this.generateImmediateSuggestions(profile, context, upcomingTasks),
      upcoming: this.generateUpcomingSuggestions(profile, upcomingTasks),
      strategic: this.generateStrategicSuggestions(profile, todayTasks)
    };
  }

  private generateImmediateSuggestions(
    profile: PersonalizationProfile,
    context: any,
    upcomingTasks: DbDailyTask[]
  ): any[] {
    const suggestions = [];
    const currentHour = context.currentTime.getHours();

    // Energy-based suggestions
    if (profile.energyPattern === 'early_bird' && currentHour >= 6 && currentHour <= 10) {
      const highPriorityTasks = upcomingTasks.filter(t => t.priority === 'high' || t.priority === 'critical');
      if (highPriorityTasks.length > 0) {
        suggestions.push({
          type: 'energy_optimization',
          title: 'Perfect Time for High-Priority Work',
          description: 'Your energy is at its peak. Consider starting your most important task now.',
          action: `Start "${highPriorityTasks[0].title}" now`,
          urgency: 'immediate'
        });
      }
    }

    // Break suggestions based on recent activity
    if (context.recentActivity === 'focused_work' && profile.productivityFactors.breakFrequency > 60) {
      suggestions.push({
        type: 'break_reminder',
        title: 'Take a Productivity Break',
        description: 'Based on your work pattern, a short break will enhance your next task performance.',
        action: 'Take a 10-15 minute break',
        urgency: 'recommended'
      });
    }

    // Context-based task suggestions
    if (context.energyLevel === 'low' && upcomingTasks.length > 0) {
      const lowEffortTasks = upcomingTasks.filter(t => 
        t.estimatedDuration <= 30 && t.priority !== 'critical'
      );
      if (lowEffortTasks.length > 0) {
        suggestions.push({
          type: 'energy_matching',
          title: 'Light Task Recommendation',
          description: 'Your energy is low. Consider tackling a quick, easy task to build momentum.',
          action: `Work on "${lowEffortTasks[0].title}"`,
          urgency: 'suggested'
        });
      }
    }

    return suggestions;
  }

  private generateUpcomingSuggestions(
    profile: PersonalizationProfile,
    upcomingTasks: DbDailyTask[]
  ): any[] {
    const suggestions = [];

    // Task sequence optimization
    if (profile.workStyle === 'focused' && upcomingTasks.length > 2) {
      const similarTasks = this.groupSimilarTasks(upcomingTasks);
      if (similarTasks.length > 1) {
        suggestions.push({
          type: 'task_batching',
          title: 'Batch Similar Tasks',
          description: 'Group similar tasks together to maintain focus and reduce context switching.',
          action: 'Reschedule similar tasks consecutively',
          impact: 'medium'
        });
      }
    }

    // Priority rebalancing
    const highPriorityTasks = upcomingTasks.filter(t => t.priority === 'high' || t.priority === 'critical');
    const lowPriorityTasks = upcomingTasks.filter(t => t.priority === 'low');
    
    if (profile.priorityStyle === 'importance_first' && lowPriorityTasks.length > highPriorityTasks.length) {
      suggestions.push({
        type: 'priority_rebalancing',
        title: 'Focus on High-Priority Tasks',
        description: 'Your schedule has more low-priority tasks. Consider rescheduling some to focus on what matters most.',
        action: 'Move low-priority tasks to later',
        impact: 'high'
      });
    }

    // Buffer time suggestions
    const totalDuration = upcomingTasks.reduce((sum, task) => sum + task.estimatedDuration, 0);
    const availableTime = this.calculateAvailableTime(upcomingTasks);
    const utilizationRate = availableTime > 0 ? (totalDuration / availableTime) * 100 : 100;

    if (utilizationRate > 90 && profile.preferences.bufferTime > 15) {
      suggestions.push({
        type: 'schedule_breathing_room',
        title: 'Add Buffer Time',
        description: 'Your schedule is packed. Adding buffer time can reduce stress and improve quality.',
        action: 'Add 15-minute buffers between tasks',
        impact: 'medium'
      });
    }

    return suggestions;
  }

  private generateStrategicSuggestions(
    profile: PersonalizationProfile,
    todayTasks: DbDailyTask[]
  ): any[] {
    const suggestions = [];

    // Workflow optimization
    if (profile.planningStyle === 'detailed' && !profile.preferences.weeklyPlanning) {
      suggestions.push({
        type: 'planning_enhancement',
        title: 'Weekly Planning Session',
        description: 'Your detailed planning style would benefit from dedicated weekly planning time.',
        action: 'Schedule 30 minutes every Sunday for weekly planning',
        impact: 'high'
      });
    }

    // Productivity pattern analysis
    const completedTasks = todayTasks.filter(t => t.status === 'completed');
    const completionRate = todayTasks.length > 0 ? (completedTasks.length / todayTasks.length) * 100 : 0;

    if (completionRate < 70 && profile.workStyle === 'structured') {
      suggestions.push({
        type: 'completion_improvement',
        title: 'Task Completion Strategy',
        description: 'Your completion rate could improve with better task sizing and scheduling.',
        action: 'Break large tasks into smaller, manageable chunks',
        impact: 'high'
      });
    }

    // Goal alignment suggestions
    suggestions.push({
      type: 'goal_alignment',
      title: 'Daily Goal Check',
      description: 'Ensure your daily tasks align with your broader objectives.',
      action: 'Review how today\'s tasks contribute to your monthly goals',
      impact: 'strategic'
    });

    return suggestions;
  }

  private groupSimilarTasks(tasks: DbDailyTask[]): DbDailyTask[] {
    // Simple similarity check based on task titles and tags
    const groups = new Map<string, DbDailyTask[]>();
    
    tasks.forEach(task => {
      const keywords = this.extractKeywords(task.title);
      const key = keywords[0] || 'misc';
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(task);
    });

    // Return tasks from the largest group if it has 2+ tasks
    const largestGroup = Array.from(groups.values())
      .sort((a, b) => b.length - a.length)[0];
    
    return largestGroup && largestGroup.length > 1 ? largestGroup : [];
  }

  private extractKeywords(title: string): string[] {
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    return title.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.includes(word))
      .slice(0, 3);
  }

  private calculateAvailableTime(tasks: DbDailyTask[]): number {
    if (tasks.length === 0) return 480; // 8 hours default
    
    const scheduledTasks = tasks.filter(t => t.scheduledTime);
    if (scheduledTasks.length === 0) return 480;

    const sorted = scheduledTasks.sort((a, b) => a.scheduledTime!.localeCompare(b.scheduledTime!));
    const firstTask = sorted[0];
    const lastTask = sorted[sorted.length - 1];

    const startTime = firstTask.scheduledTime!;
    const endTime = this.addMinutesToTime(lastTask.scheduledTime!, lastTask.estimatedDuration);

    return this.calculateTimeDifference(startTime, endTime);
  }

  /**
   * Learn from user feedback and adapt personalization
   */
  async adaptFromFeedback(userId: string, feedback: {
    suggestionId: string;
    action: 'accepted' | 'dismissed' | 'modified';
    effectiveness?: number; // 1-5 rating
    comments?: string;
  }): Promise<void> {
    const profile = await this.getPersonalizationProfile(userId);
    if (!profile) return;

    // Store feedback for learning
    await storage.insights.createInsight({
      userId,
      insightType: 'personalization_feedback',
      data: {
        suggestionId: feedback.suggestionId,
        action: feedback.action,
        effectiveness: feedback.effectiveness,
        comments: feedback.comments,
        profileSnapshot: profile,
        timestamp: new Date()
      },
      confidence: '1.0',
    });

    // Adapt profile based on feedback
    if (feedback.action === 'dismissed' && feedback.effectiveness && feedback.effectiveness < 3) {
      await this.adjustPersonalizationWeights(userId, feedback);
    }
  }

  private async adjustPersonalizationWeights(userId: string, feedback: any): Promise<void> {
    // This would implement machine learning-like adaptation
    // For now, we'll implement simple rule-based adjustments
    
    const profile = await this.getPersonalizationProfile(userId);
    if (!profile) return;

    // Adjust confidence in certain recommendations based on feedback
    // This is a simplified version - in production, you'd use more sophisticated ML
    
    await storage.insights.createInsight({
      userId,
      insightType: 'personalization_adjustment',
      data: {
        adjustmentType: 'confidence_reduction',
        originalProfile: profile,
        feedbackTrigger: feedback,
        timestamp: new Date()
      },
      confidence: '0.8'
    });
  }

  /**
   * Generate performance analytics for personalization effectiveness
   */
  async getPersonalizationAnalytics(userId: string): Promise<{
    profileAccuracy: number;
    suggestionAcceptanceRate: number;
    productivityImpact: number;
    adaptationHistory: any[];
  }> {
    const feedbackInsights = await storage.insights.getUserInsights(userId, 'personalization_feedback');
    const adjustmentInsights = await storage.insights.getUserInsights(userId, 'personalization_adjustment');
    
    const totalFeedback = feedbackInsights.length;
    const acceptedSuggestions = feedbackInsights.filter(f => f.data.action === 'accepted').length;
    const acceptanceRate = totalFeedback > 0 ? (acceptedSuggestions / totalFeedback) * 100 : 0;

    // Calculate productivity impact based on task completion rates before/after personalization
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentStats = await storage.tasks.getTaskCompletionStats(userId, thirtyDaysAgo, new Date());
    
    return {
      profileAccuracy: this.calculateProfileAccuracy(feedbackInsights),
      suggestionAcceptanceRate: acceptanceRate,
      productivityImpact: recentStats.completionRate,
      adaptationHistory: adjustmentInsights.map(insight => ({
        date: insight.createdAt,
        type: insight.data.adjustmentType,
        trigger: insight.data.feedbackTrigger
      }))
    };
  }

  private calculateProfileAccuracy(feedbackInsights: any[]): number {
    if (feedbackInsights.length === 0) return 80; // Default accuracy
    
    const effectivenessSores = feedbackInsights
      .filter(f => f.data.effectiveness)
      .map(f => f.data.effectiveness);
    
    if (effectivenessSores.length === 0) return 80;
    
    const averageEffectiveness = effectivenessSores.reduce((sum, score) => sum + score, 0) / effectivenessSores.length;
    return (averageEffectiveness / 5) * 100;
  }
}

// Export singleton instance
export const personalizationEngine = new PersonalizationEngine();