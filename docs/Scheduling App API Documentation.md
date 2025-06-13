# Scheduling App API Documentation

## Table of Contents
1. [Authentication Routes](#authentication-routes)
2. [User Management Routes](#user-management-routes)
3. [Goal Management Routes](#goal-management-routes)
4. [Objective Management Routes](#objective-management-routes)
5. [Task Management Routes](#task-management-routes)
6. [AI Services Routes](#ai-services-routes)
7. [Natural Language Processing Routes](#natural-language-processing-routes)
8. [Personalization Routes](#personalization-routes)
9. [Suggestions Routes](#suggestions-routes)
10. [Ambient AI Routes](#ambient-ai-routes)
11. [Data Schemas](#data-schemas)

---

## Authentication Routes

### POST /api/auth/register
**Description:** Register a new user account

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "securepassword123",
  "firstName": "John",        // Optional
  "lastName": "Doe",          // Optional
  "timezone": "America/New_York"  // Optional, defaults to UTC
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "firstName": "John",
      "lastName": "Doe",
      "timezone": "America/New_York"
    }
  },
  "message": "User registered successfully"
}
```

### POST /api/auth/login
**Description:** Login to existing account

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe"
    }
  },
  "message": "Login successful"
}
```

### POST /api/auth/logout
**Description:** Logout current user session

**Request Body:** None

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### GET /api/auth/me
**Description:** Get current user information

**Headers:** Requires authentication

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe"
    }
  }
}
```

---

## User Management Routes

### GET /api/users/profile
**Description:** Get user profile information

**Headers:** Requires authentication

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "firstName": "John",
      "lastName": "Doe",
      "timezone": "America/New_York",
      "preferences": {
        "workingHours": {
          "start": "09:00",
          "end": "17:00"
        },
        "preferredTaskDuration": 30,
        "energyLevels": {
          "morning": "high",
          "afternoon": "medium",
          "evening": "low"
        }
      }
    }
  }
}
```

### PUT /api/users/profile
**Description:** Update user profile information

**Headers:** Requires authentication

**Request Body:**
```json
{
  "firstName": "John",        // Optional
  "lastName": "Doe",          // Optional
  "timezone": "America/New_York",  // Optional
  "preferences": {            // Optional
    "workingHours": {
      "start": "09:00",
      "end": "17:00"
    },
    "preferredTaskDuration": 30,
    "energyLevels": {
      "morning": "high",      // low, medium, high
      "afternoon": "medium",
      "evening": "low"
    }
  }
}
```

### GET /api/users/stats
**Description:** Get user statistics and overview

**Headers:** Requires authentication

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalGoals": 5,
      "activeGoals": 3,
      "completedGoals": 2,
      "monthlyObjectives": 8,
      "monthlyTasks": 25,
      "taskCompletionRate": 85.5,
      "tasksCompleted": 18,
      "totalTasks": 21
    }
  }
}
```

---

## Goal Management Routes

### GET /api/goals
**Description:** Get all goals for the authenticated user

**Headers:** Requires authentication

**Query Parameters:**
- `year` (optional): Filter by target year
- `category` (optional): Filter by category
- `status` (optional): Filter by status

**Response:**
```json
{
  "success": true,
  "data": {
    "goals": [
      {
        "id": "uuid",
        "title": "Learn Data Science",
        "description": "Complete comprehensive data science education",
        "category": "education",
        "targetYear": 2024,
        "priority": "high",
        "status": "active",
        "aiDecomposed": true,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

### GET /api/goals/:id
**Description:** Get a specific goal by ID

**Headers:** Requires authentication

**Response:**
```json
{
  "success": true,
  "data": {
    "goal": {
      "id": "uuid",
      "title": "Learn Data Science",
      "description": "Complete comprehensive data science education",
      "category": "education",
      "targetYear": 2024,
      "priority": "high",
      "status": "active"
    }
  }
}
```

### POST /api/goals
**Description:** Create a new goal

**Headers:** Requires authentication

**Request Body:**
```json
{
  "title": "Learn Data Science",
  "description": "Complete comprehensive data science education",  // Optional
  "category": "education",     // career, health, personal, financial, education, other
  "targetYear": 2024,
  "priority": "high"           // low, medium, high, critical
}
```

### PUT /api/goals/:id
**Description:** Update an existing goal

**Headers:** Requires authentication

**Request Body:** Same as POST but all fields are optional

### DELETE /api/goals/:id
**Description:** Delete a goal

**Headers:** Requires authentication

**Response:**
```json
{
  "success": true,
  "message": "Goal deleted successfully"
}
```

### POST /api/goals/:id/decompose
**Description:** Mark goal for AI decomposition

**Headers:** Requires authentication

**Response:**
```json
{
  "success": true,
  "data": {
    "goal": {
      "id": "uuid",
      "aiDecomposed": true
    }
  },
  "message": "Goal marked for AI decomposition"
}
```

---

## Objective Management Routes

### GET /api/objectives
**Description:** Get objectives for the authenticated user

**Headers:** Requires authentication

**Query Parameters:**
- `month` (optional): Filter by target month
- `year` (optional): Filter by target year
- `goalId` (optional): Filter by specific goal

**Response:**
```json
{
  "success": true,
  "data": {
    "objectives": [
      {
        "id": "uuid",
        "goalId": "uuid",
        "title": "Complete Python Fundamentals",
        "description": "Master basic Python programming concepts",
        "targetMonth": 1,
        "targetYear": 2024,
        "keyResults": [
          {
            "id": "uuid",
            "description": "Complete 10 Python exercises",
            "targetValue": 10,
            "currentValue": 3,
            "unit": "exercises",
            "completed": false
          }
        ],
        "status": "active",
        "progress": 30
      }
    ]
  }
}
```

### GET /api/objectives/:id
**Description:** Get a specific objective with related tasks

**Headers:** Requires authentication

**Response:**
```json
{
  "success": true,
  "data": {
    "objective": {
      "id": "uuid",
      "title": "Complete Python Fundamentals",
      "keyResults": [...]
    },
    "tasks": [
      {
        "id": "uuid",
        "title": "Read Python Chapter 1",
        "scheduledDate": "2024-01-15T00:00:00Z"
      }
    ]
  }
}
```

### POST /api/objectives
**Description:** Create a new objective

**Headers:** Requires authentication

**Request Body:**
```json
{
  "goalId": "uuid",
  "title": "Complete Python Fundamentals",
  "description": "Master basic Python programming concepts",  // Optional
  "targetMonth": 1,        // 1-12
  "targetYear": 2024,
  "keyResults": [          // Optional, defaults to empty array
    {
      "description": "Complete 10 Python exercises",
      "targetValue": 10,     // Optional
      "unit": "exercises"    // Optional
    }
  ]
}
```

### PUT /api/objectives/:id
**Description:** Update an existing objective

**Headers:** Requires authentication

**Request Body:** Same as POST but all fields are optional

### PUT /api/objectives/:id/key-results
**Description:** Update a specific key result

**Headers:** Requires authentication

**Request Body:**
```json
{
  "keyResultId": "uuid",
  "currentValue": 5,       // Optional
  "completed": true        // Optional
}
```

### DELETE /api/objectives/:id
**Description:** Delete an objective

**Headers:** Requires authentication

---

## Task Management Routes

### GET /api/tasks
**Description:** Get tasks for the authenticated user

**Headers:** Requires authentication

**Query Parameters:**
- `startDate` (optional): Filter by start date (YYYY-MM-DD)
- `endDate` (optional): Filter by end date (YYYY-MM-DD)
- `status` (optional): Filter by status
- `priority` (optional): Filter by priority
- `objectiveId` (optional): Filter by objective
- `goalId` (optional): Filter by goal

**Response:**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "uuid",
        "title": "Read Python Chapter 1",
        "description": "Study basic Python syntax and variables",
        "scheduledDate": "2024-01-15T00:00:00Z",
        "scheduledTime": "09:00",
        "estimatedDuration": 60,
        "actualDuration": 65,
        "priority": "medium",
        "status": "completed",
        "tags": ["learning", "python"],
        "location": "Home Office",
        "completedAt": "2024-01-15T10:05:00Z"
      }
    ]
  }
}
```

### GET /api/tasks/:id
**Description:** Get a specific task by ID

**Headers:** Requires authentication

### POST /api/tasks
**Description:** Create a new task

**Headers:** Requires authentication

**Request Body:**
```json
{
  "objectiveId": "uuid",      // Optional
  "goalId": "uuid",           // Optional
  "title": "Read Python Chapter 1",
  "description": "Study basic Python syntax and variables",  // Optional
  "scheduledDate": "2024-01-15",
  "scheduledTime": "09:00",   // Optional (HH:MM format)
  "estimatedDuration": 60,    // Minutes, defaults to 30
  "priority": "medium",       // low, medium, high, critical
  "tags": ["learning", "python"],  // Optional, defaults to []
  "location": "Home Office",  // Optional
  "reminderMinutes": 15       // Optional
}
```

### PUT /api/tasks/:id
**Description:** Update an existing task

**Headers:** Requires authentication

**Request Body:** Same as POST but all fields are optional

### POST /api/tasks/:id/complete
**Description:** Mark a task as completed

**Headers:** Requires authentication

**Request Body:**
```json
{
  "actualDuration": 65  // Optional - actual time spent in minutes
}
```

### DELETE /api/tasks/:id
**Description:** Delete a task

**Headers:** Requires authentication

### GET /api/tasks/stats/completion
**Description:** Get task completion statistics

**Headers:** Requires authentication

**Query Parameters:**
- `startDate` (optional): Start date for statistics
- `endDate` (optional): End date for statistics

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total": 25,
      "completed": 18,
      "pending": 7,
      "completionRate": 72.0,
      "averageDuration": 45.5
    }
  }
}
```

---

## AI Services Routes

### POST /api/ai/decompose-goal
**Description:** Use AI to decompose a goal into monthly objectives

**Headers:** Requires authentication

**Request Body:**
```json
{
  "goalId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "objectives": [
      {
        "id": "uuid",
        "title": "Complete Python Fundamentals",
        "description": "Master basic Python programming concepts",
        "targetMonth": 1,
        "keyResults": [...]
      }
    ],
    "reasoning": "AI reasoning for decomposition strategy",
    "confidence": 0.85
  },
  "message": "Goal successfully decomposed into monthly objectives"
}
```

### POST /api/ai/generate-tasks
**Description:** Generate tasks for a monthly objective using AI

**Headers:** Requires authentication

**Request Body:**
```json
{
  "objectiveId": "uuid",
  "weekNumber": 1    // 1-4, defaults to 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "uuid",
        "title": "Read Python Chapter 1",
        "estimatedDuration": 60,
        "priority": "medium"
      }
    ],
    "reasoning": "AI reasoning for task generation",
    "confidence": 0.8
  },
  "message": "Generated 5 tasks for week 1"
}
```

### POST /api/ai/optimize-schedule
**Description:** Optimize task schedule using AI

**Headers:** Requires authentication

**Request Body:**
```json
{
  "date": "2024-01-15",
  "taskIds": ["uuid1", "uuid2"]  // Optional - specific tasks to optimize
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "optimizedTasks": [
      {
        "taskId": "uuid",
        "suggestedTime": "09:00",
        "reason": "Optimal time based on energy patterns"
      }
    ],
    "insights": ["Schedule during peak energy hours"],
    "confidence": 0.9
  },
  "message": "Optimized schedule for 3 tasks"
}
```

### POST /api/ai/process-nl
**Description:** Process natural language commands using AI

**Headers:** Requires authentication

**Request Body:**
```json
{
  "text": "Schedule a meeting with John tomorrow at 2 PM",
  "context": {}  // Optional additional context
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "intent": "add_task",
    "entities": {
      "title": "meeting with John",
      "date": "tomorrow",
      "time": "14:00"
    },
    "confidence": 0.9,
    "response": "I'll schedule a meeting with John for tomorrow at 2 PM"
  }
}
```

### GET /api/ai/productivity-insights
**Description:** Generate AI-powered productivity insights

**Headers:** Requires authentication

**Response:**
```json
{
  "success": true,
  "data": {
    "insights": [
      {
        "type": "completion_pattern",
        "title": "Morning Productivity Peak",
        "description": "You complete 80% more tasks in morning hours",
        "actionable_tips": ["Schedule important tasks before 11 AM"],
        "confidence": 0.85
      }
    ],
    "overall_productivity_score": 78
  },
  "message": "Productivity insights generated"
}
```

### POST /api/ai/smart-recommendations
**Description:** Get smart recommendations based on context

**Headers:** Requires authentication

**Request Body:**
```json
{
  "type": "daily_schedule",     // daily_schedule, goal_progress, task_optimization
  "context": {
    "date": "2024-01-15",
    "currentTime": "09:00"
  }
}
```

---

## Natural Language Processing Routes

### GET /api/nl/commands
**Description:** Get history of processed natural language commands

**Headers:** Requires authentication

**Query Parameters:**
- `limit` (optional): Number of commands to return (default: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "commands": [
      {
        "id": "uuid",
        "originalText": "Schedule a meeting tomorrow at 2 PM",
        "parsedIntent": "add_task",
        "extractedEntities": {
          "title": "meeting",
          "date": "tomorrow",
          "time": "14:00"
        },
        "actionTaken": true,
        "confidence": 0.9,
        "createdAt": "2024-01-15T08:30:00Z"
      }
    ]
  }
}
```

### POST /api/nl/process
**Description:** Process a natural language command

**Headers:** Requires authentication

**Request Body:**
```json
{
  "text": "Cancel my meeting with Sarah on Friday"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "command": {
      "id": "uuid",
      "originalText": "Cancel my meeting with Sarah on Friday",
      "parsedIntent": "delete_task"
    },
    "parsed": {
      "intent": "delete_task",
      "entities": {
        "taskIdentifier": "meeting with Sarah",
        "date": "Friday"
      },
      "confidence": 0.8
    },
    "result": {
      "success": true,
      "message": "Task cancelled successfully"
    }
  },
  "message": "Command processed successfully"
}
```

---

## Personalization Routes

### GET /api/personalization/profile
**Description:** Get user's personalization profile

**Headers:** Requires authentication

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "userId": "uuid",
      "workStyle": "focused",        // focused, flexible, structured, creative
      "energyPattern": "early_bird", // early_bird, night_owl, consistent, variable
      "priorityStyle": "importance_first", // deadline_driven, importance_first, balanced, reactive
      "planningStyle": "detailed",   // detailed, high_level, adaptive, minimal
      "productivityFactors": {
        "optimalTaskDuration": 45,
        "breakFrequency": 70,
        "focusBlocks": 3,
        "multitaskingTolerance": "low"  // low, medium, high
      },
      "preferences": {
        "morningRoutine": true,
        "eveningReview": true,
        "weeklyPlanning": true,
        "bufferTime": 15
      },
      "lastUpdated": "2024-01-15T10:00:00Z"
    },
    "analytics": {
      "accuracy": 85.5,
      "lastUpdated": "2024-01-15T10:00:00Z",
      "dataPoints": 127
    }
  },
  "message": "Personalization profile retrieved successfully"
}
```

### POST /api/personalization/profile/refresh
**Description:** Force refresh of personalization profile

**Headers:** Requires authentication

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "userId": "uuid",
      "workStyle": "focused"
    }
  },
  "message": "Personalization profile refreshed successfully"
}
```

### GET /api/personalization/recommendations
**Description:** Get personalized recommendations for a specific date

**Headers:** Requires authentication

**Query Parameters:**
- `date` (optional): Date for recommendations (YYYY-MM-DD, defaults to today)

**Response:**
```json
{
  "success": true,
  "data": {
    "schedulingRecommendations": [
      {
        "type": "energy_alignment",
        "title": "Schedule High-Priority Tasks in Morning",
        "description": "Based on your early bird pattern...",
        "impact": "high",
        "effort": "low",
        "priorityScore": 85,
        "applicableNow": true
      }
    ],
    "taskOptimizations": [...],
    "workflowSuggestions": [...],
    "targetDate": "2024-01-15",
    "taskCount": 8,
    "completedTasks": 3
  },
  "message": "Personalized recommendations generated successfully"
}
```

### POST /api/personalization/contextual-suggestions
**Description:** Generate contextual suggestions based on current situation

**Headers:** Requires authentication

**Request Body:**
```json
{
  "location": "Home Office",     // Optional
  "recentActivity": "focused_work", // focused_work, meetings, administrative, creative, break, planning
  "energyLevel": "high"          // low, medium, high
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "immediate": [
      {
        "type": "energy_optimization",
        "title": "Perfect Time for High-Priority Work",
        "description": "Your energy is at its peak...",
        "action": "Start 'Data Analysis Project' now",
        "urgency": "immediate",
        "id": "suggestion_uuid",
        "validUntil": "2024-01-15T11:00:00Z",
        "category": "immediate_action"
      }
    ],
    "upcoming": [...],
    "strategic": [...],
    "context": {
      "timestamp": "2024-01-15T09:30:00Z",
      "location": "Home Office",
      "recentActivity": "focused_work",
      "energyLevel": "high"
    },
    "totalSuggestions": 8
  },
  "message": "Contextual suggestions generated successfully"
}
```

### POST /api/personalization/goal-decomposition/:goalId
**Description:** Get personalized goal decomposition strategy

**Headers:** Requires authentication

**Request Body:**
```json
{
  "considerPersonalization": true,  // Optional, defaults to true
  "customParameters": {             // Optional
    "timelineAdjustment": 1.2,      // 0.5-2.0 multiplier
    "complexityPreference": "moderate", // simple, moderate, detailed
    "focusAreas": ["skill-building", "networking"]  // Max 5 areas
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "decomposition": {
      "decompositionStrategy": "milestone_driven",
      "timelineAdjustments": [
        {
          "type": "concentration_blocks",
          "description": "Allocate longer time blocks for deep work tasks",
          "adjustment": "Increase task durations by 25%"
        }
      ],
      "motivationalFactors": ["Clear impact metrics", "Progress visibility"]
    },
    "goal": {
      "id": "uuid",
      "title": "Learn Data Science",
      "category": "education"
    },
    "existingObjectives": 0,
    "customizationApplied": true,
    "personalizationUsed": true
  },
  "message": "Personalized goal decomposition completed"
}
```

### POST /api/personalization/feedback
**Description:** Record feedback on personalization suggestions

**Headers:** Requires authentication

**Request Body:**
```json
{
  "suggestionId": "uuid",
  "action": "accepted",        // accepted, dismissed, modified
  "effectiveness": 4,          // Optional: 1-5 rating
  "comments": "Very helpful timing suggestion"  // Optional: max 500 chars
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "feedbackRecorded": true,
    "learningTriggered": true
  },
  "message": "Feedback recorded successfully"
}
```

### GET /api/personalization/analytics
**Description:** Get personalization effectiveness analytics

**Headers:** Requires authentication

**Query Parameters:**
- `timeframe` (optional): Number of days for analysis (default: 30)

**Response:**
```json
{
  "success": true,
  "data": {
    "profileAccuracy": 87.5,
    "suggestionAcceptanceRate": 78.3,
    "productivityImpact": 82.1,
    "adaptationHistory": [
      {
        "date": "2024-01-10T14:30:00Z",
        "type": "confidence_reduction",
        "trigger": "user_dismissed_suggestion"
      }
    ],
    "timeframe": "30 days",
    "lastUpdated": "2024-01-15T10:00:00Z"
  },
  "message": "Personalization analytics retrieved successfully"
}
```

### GET /api/personalization/insights
**Description:** Get insights about personalization patterns

**Headers:** Requires authentication

**Response:**
```json
{
  "success": true,
  "data": {
    "insights": [
      {
        "id": "uuid",
        "insightType": "personalization_feedback",
        "data": {
          "suggestionId": "uuid",
          "action": "accepted",
          "effectiveness": 4
        },
        "createdAt": "2024-01-15T09:00:00Z"
      }
    ],
    "patterns": {
      "feedbackTrends": ["positive_morning_suggestions", "negative_evening_tasks"],
      "adaptationCount": 5,
      "patterns": ["prefers_detailed_planning", "responds_well_to_energy_based_suggestions"]
    },
    "improvements": [
      {
        "area": "timing_suggestions",
        "recommendation": "Increase weight on energy-based scheduling",
        "expectedImpact": "medium"
      }
    ],
    "totalInsights": 127
  },
  "message": "Personalization insights retrieved successfully"
}
```

### POST /api/personalization/preferences
**Description:** Update personalization preferences

**Headers:** Requires authentication

**Request Body:**
```json
{
  "workStyle": "focused",           // Optional
  "energyPattern": "early_bird",    // Optional
  "planningPreferences": {          // Optional
    "preferredPlanningTime": "evening",
    "detailLevel": "moderate",
    "reviewFrequency": "weekly"
  },
  "notificationPreferences": {      // Optional
    "suggestionFrequency": "moderate",
    "reminderStyle": "gentle",
    "insightSharing": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "preferences": {
      "workStyle": "focused",
      "energyPattern": "early_bird"
    },
    "profileUpdated": true,
    "updatedProfile": {
      "workStyle": "focused",
      "energyPattern": "early_bird",
      "priorityStyle": "importance_first",
      "planningStyle": "detailed"
    }
  },
  "message": "Personalization preferences updated successfully"
}
```

---

## Suggestions Routes

### GET /api/suggestions
**Description:** Get active suggestions for the user

**Headers:** Requires authentication

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "id": "uuid",
        "type": "schedule_optimization",
        "title": "Optimize Your Schedule",
        "description": "You have 3 unscheduled tasks...",
        "priority": "medium",        // low, medium, high
        "confidence": 0.8,
        "validUntil": "2024-01-16T00:00:00Z",
        "actionable": true,
        "context": {
          "unscheduledTaskIds": ["uuid1", "uuid2"]
        }
      }
    ],
    "count": 5
  },
  "message": "Active suggestions retrieved"
}
```

### POST /api/suggestions/:id/apply
**Description:** Apply a specific suggestion

**Headers:** Requires authentication

**Request Body:**
```json
{
  "suggestionId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "applied": true,
    "changes": [
      {
        "type": "task_scheduled",
        "taskId": "uuid",
        "newTime": "09:00"
      }
    ]
  },
  "message": "Suggestion applied successfully"
}
```

### POST /api/suggestions/:id/dismiss
**Description:** Dismiss a specific suggestion

**Headers:** Requires authentication

**Response:**
```json
{
  "success": true,
  "message": "Suggestion dismissed"
}
```

### POST /api/suggestions/generate
**Description:** Force generate new suggestions

**Headers:** Requires authentication

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [...],
    "count": 7
  },
  "message": "Generated 7 new suggestions"
}
```

### GET /api/suggestions/learning-status
**Description:** Get ambient learning status

**Headers:** Requires authentication

**Response:**
```json
{
  "success": true,
  "data": {
    "learningActive": true,
    "lastAnalysis": "2024-01-15T08:00:00Z",
    "patternsDetected": 15,
    "suggestionsGenerated": 3
  }
}
```

---

## Ambient AI Routes

### GET /api/ambient-ai/suggestions
**Description:** Get active proactive suggestions from ambient AI

**Headers:** Requires authentication

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "id": "uuid",
        "type": "energy_optimization",
        "title": "Align Tasks with Energy Levels",
        "description": "2 high-priority tasks are scheduled during low-energy periods",
        "priority": "high",
        "confidence": 0.9,
        "validUntil": "2024-01-15T21:00:00Z",
        "context": {
          "misalignedTaskIds": ["uuid1", "uuid2"],
          "energyLevels": {
            "morning": "high",
            "afternoon": "medium",
            "evening": "low"
          }
        }
      }
    ]
  },
  "message": "Active proactive suggestions retrieved"
}
```

### POST /api/ambient-ai/suggestions/:id/apply
**Description:** Apply an ambient AI suggestion

**Headers:** Requires authentication

**Response:**
```json
{
  "success": true,
  "data": {
    "result": {
      "success": true,
      "message": "Rescheduled 2 tasks to align with your energy levels"
    }
  },
  "message": "Ambient AI suggestion applied successfully"
}
```

### POST /api/ambient-ai/suggestions/:id/dismiss
**Description:** Dismiss an ambient AI suggestion

**Headers:** Requires authentication

**Response:**
```json
{
  "success": true,
  "message": "Suggestion dismissed and learning updated"
}
```

---

## Data Schemas

### Task Priority Levels
- `low`: Non-urgent, flexible timing
- `medium`: Standard priority (default)
- `high`: Important, should be completed soon
- `critical`: Urgent, high importance

### Task Status Values
- `pending`: Not started
- `in_progress`: Currently being worked on
- `completed`: Finished successfully
- `cancelled`: Cancelled before completion
- `rescheduled`: Moved to different time/date

### Goal Categories
- `career`: Professional development and work-related goals
- `health`: Physical and mental health objectives
- `personal`: Personal development and life goals
- `financial`: Money, savings, and investment goals
- `education`: Learning and skill development
- `other`: Miscellaneous goals

### Energy Levels
- `low`: Limited energy, suitable for easy tasks
- `medium`: Normal energy level
- `high`: Peak energy, ideal for challenging tasks

### Natural Language Intents
- `add_task`: Creating new tasks
- `modify_task`: Updating existing tasks
- `delete_task`: Removing tasks
- `schedule_task`: Scheduling or rescheduling tasks
- `ask_question`: Information queries

### Time Formats
- **Date**: ISO 8601 format (`YYYY-MM-DD`) or full timestamp (`YYYY-MM-DDTHH:MM:SSZ`)
- **Time**: 24-hour format (`HH:MM`)
- **Duration**: Minutes as integer

### Authentication
All routes marked with "Requires authentication" need a valid session. Authentication is session-based using cookies.

### Error Responses
All endpoints may return error responses in this format:
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (access denied)
- `404`: Not Found
- `500`: Internal Server Error

---

## Rate Limiting
API requests may be rate-limited. Standard limits apply:
- 100 requests per minute for general endpoints
- 10 requests per minute for AI-powered endpoints
- 5 requests per minute for intensive operations (goal decomposition, bulk operations)

## Data Validation
All request data is validated using Zod schemas. Validation errors will return detailed error messages indicating which fields are invalid and why.
