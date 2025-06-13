import axios from 'axios';
import Cookies from 'js-cookie';
import { User, Goal, Objective, Task, ApiResponse } from '../types/models';
import { ambientAI } from 'server/services/ambient-ai';

// Configure axios defaults
const api = axios.create({
  baseURL: 'http://localhost:8888/',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add authorization header
api.interceptors.request.use(
  (config) => {
    const accessToken = Cookies.get('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh and error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = Cookies.get('refreshToken');
        if (refreshToken) {
          // Try to refresh the token
          const response = await axios.post(
            'http://localhost:8888/api/auth/refresh',
            {
              refreshToken,
            }
          );

          if (response.data.success && response.data.data?.accessToken) {
            const newAccessToken = response.data.data.accessToken;
            const newRefreshToken =
              response.data.data.refreshToken || refreshToken;

            // Update cookies
            Cookies.set('accessToken', newAccessToken, {
              expires: 1,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict',
            });

            if (response.data.data.refreshToken) {
              Cookies.set('refreshToken', newRefreshToken, {
                expires: 7,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
              });
            }

            // Update the original request with new token
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Clear invalid tokens
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        localStorage.removeItem('user');
        // Redirect to login
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response) {
      console.error('API Error:', error.response.data);
      return Promise.reject(error.response.data);
    } else if (error.request) {
      console.error('API No Response:', error.request);
      return Promise.reject({ message: 'No response from server' });
    } else {
      console.error('API Error Setup:', error.message);
      return Promise.reject({ message: error.message });
    }
  }
);

// ============================================================================
// AUTHENTICATION FUNCTIONS
// ============================================================================

/**
 * Register a new user account
 * @param userData - The user registration data
 * @param userData.email - User's email address
 * @param userData.username - Desired username
 * @param userData.password - User's password
 * @param userData.firstName - Optional first name
 * @param userData.lastName - Optional last name
 * @param userData.timezone - Optional timezone (defaults to UTC)
 * @returns Promise containing the API response with user data
 */
export const registerUser = async (userData: {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  timezone?: string;
}): Promise<ApiResponse<{ user: User }>> => {
  const response = await api.post('/api/auth/register', userData);
  return response.data;
};

/**
 * Login to an existing user account
 * @param credentials - Login credentials
 * @param credentials.email - User's email address
 * @param credentials.password - User's password
 * @returns Promise containing the API response with user data
 */
export const loginUser = async (credentials: {
  email: string;
  password: string;
}): Promise<
  ApiResponse<{
    refreshToken(
      user: {
        id: string;
        email: string;
        username: string;
        firstName: string;
        lastName: string;
        timezone: string;
      },
      accessToken: (
        user: {
          id: string;
          email: string;
          username: string;
          firstName: string;
          lastName: string;
          timezone: string;
        },
        accessToken: any,
        refreshToken: any
      ) => unknown,
      refreshToken: any
    ): unknown;
    accessToken(
      user: {
        id: string;
        email: string;
        username: string;
        firstName: string;
        lastName: string;
        timezone: string;
      },
      accessToken: any,
      refreshToken: any
    ): unknown;
    user: User;
  }>
> => {
  const response = await api.post('/api/auth/login', credentials);
  return response.data;
};

/**
 * Logout the current user session
 * @returns Promise containing the API response
 */
export const logoutUser = async (): Promise<ApiResponse> => {
  const response = await api.post('/api/auth/logout');
  return response.data;
};

/**
 * Get current authenticated user information
 * @returns Promise containing the API response with current user data
 */
export const getCurrentUser = async (): Promise<
  ApiResponse<{ user: User }>
> => {
  const response = await api.get('/api/auth/me');
  return response.data;
};

// ============================================================================
// USER MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Get the current user's profile information
 * @returns Promise containing the API response with user profile data
 */
export const getUserProfile = async (): Promise<
  ApiResponse<{ user: User }>
> => {
  const response = await api.get('/api/users/profile');
  return response.data;
};

/**
 * Update the current user's profile information
 * @param profileData - Profile data to update
 * @param profileData.firstName - Optional first name
 * @param profileData.lastName - Optional last name
 * @param profileData.timezone - Optional timezone
 * @param profileData.preferences - Optional user preferences
 * @param profileData.preferences.workingHours - Working hours configuration
 * @param profileData.preferences.preferredTaskDuration - Preferred task duration in minutes
 * @param profileData.preferences.energyLevels - Energy levels throughout the day
 * @returns Promise containing the API response
 */
export const updateUserProfile = async (profileData: {
  firstName?: string;
  lastName?: string;
  timezone?: string;
  preferences?: {
    workingHours?: {
      start: string;
      end: string;
    };
    preferredTaskDuration?: number;
    energyLevels?: {
      morning: string;
      afternoon: string;
      evening: string;
    };
  };
}): Promise<ApiResponse> => {
  const response = await api.put('/api/users/profile', profileData);
  return response.data;
};

/**
 * Get user statistics and overview data
 * @returns Promise containing the API response with user statistics
 */
export const getUserStatistics = async (): Promise<
  ApiResponse<{ stats: any }>
> => {
  const response = await api.get('/api/users/stats');
  return response.data;
};

// ============================================================================
// GOAL MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Get all goals for the authenticated user with optional filtering
 * @param filters - Optional filters to apply
 * @param filters.year - Filter by target year
 * @param filters.category - Filter by category
 * @param filters.status - Filter by status
 * @returns Promise containing the API response with goals array
 */
export const getAllGoals = async (filters?: {
  year?: string;
  category?: string;
  status?: string;
}): Promise<ApiResponse<{ goals: Goal[] }>> => {
  const response = await api.get('/api/goals', { params: filters });
  return response.data;
};

/**
 * Get a specific goal by its ID
 * @param id - The goal ID
 * @returns Promise containing the API response with goal data
 */
export const getGoalById = async (
  id: string
): Promise<ApiResponse<{ goal: Goal }>> => {
  const response = await api.get(`/api/goals/${id}`);
  return response.data;
};

/**
 * Create a new goal
 * @param goalData - The goal data
 * @param goalData.title - Goal title
 * @param goalData.description - Optional goal description
 * @param goalData.category - Goal category
 * @param goalData.targetYear - Target year for completion
 * @param goalData.priority - Priority level (low, medium, high, critical)
 * @returns Promise containing the API response with created goal
 */
export const createNewGoal = async (goalData: {
  title: string;
  description?: string;
  category: string;
  targetYear: number;
  priority: string;
}): Promise<ApiResponse<{ goal: Goal }>> => {
  const response = await api.post('/api/goals', goalData);
  return response.data;
};

/**
 * Update an existing goal
 * @param id - The goal ID to update
 * @param goalData - Partial goal data to update
 * @returns Promise containing the API response
 */
export const updateExistingGoal = async (
  id: string,
  goalData: Partial<Goal>
): Promise<ApiResponse> => {
  const response = await api.put(`/api/goals/${id}`, goalData);
  return response.data;
};

/**
 * Delete a goal
 * @param id - The goal ID to delete
 * @returns Promise containing the API response
 */
export const deleteGoal = async (id: string): Promise<ApiResponse> => {
  const response = await api.delete(`/api/goals/${id}`);
  return response.data;
};

/**
 * Mark a goal for AI decomposition into objectives
 * @param id - The goal ID to decompose
 * @returns Promise containing the API response with updated goal
 */
export const decomposeGoalIntoObjectives = async (
  id: string
): Promise<ApiResponse<{ goal: Goal }>> => {
  const response = await api.post(`/api/goals/${id}/decompose`);
  return response.data;
};

// ============================================================================
// OBJECTIVE MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Get objectives for the authenticated user with optional filtering
 * @param filters - Optional filters to apply
 * @param filters.month - Filter by target month
 * @param filters.year - Filter by target year
 * @param filters.goalId - Filter by goal ID
 * @returns Promise containing the API response with objectives array
 */
export const getAllObjectives = async (filters?: {
  month?: number;
  year?: number;
  goalId?: string;
  status?: string;
}): Promise<ApiResponse<{ objectives: Objective[] }>> => {
  const response = await api.get('/api/objectives', { params: filters });
  return response.data;
};

/**
 * Get a specific objective by its ID, including associated tasks
 * @param id - The objective ID
 * @returns Promise containing the API response with objective and tasks data
 */
export const getObjectiveById = async (
  id: string
): Promise<ApiResponse<{ objective: Objective; tasks: Task[] }>> => {
  const response = await api.get(`/api/objectives/${id}`);
  return response.data;
};

/**
 * Create a new objective
 * @param objectiveData - The objective data
 * @param objectiveData.goalId - Parent goal ID
 * @param objectiveData.title - Objective title
 * @param objectiveData.description - Optional objective description
 * @param objectiveData.targetMonth - Target month for completion
 * @param objectiveData.targetYear - Target year for completion
 * @param objectiveData.keyResults - Optional key results array
 * @returns Promise containing the API response with created objective
 */
export const createNewObjective = async (objectiveData: {
  goalId: string;
  title: string;
  description?: string;
  targetMonth: number;
  targetYear: number;
  keyResults?: {
    description: string;
    targetValue?: number;
    unit?: string;
  }[];
}): Promise<ApiResponse<{ objective: Objective }>> => {
  console.log('Creating new objective with data:', objectiveData);
  const response = await api.post('/api/objectives', objectiveData);
  return response.data;
};

/**
 * Update an existing objective
 * @param id - The objective ID to update
 * @param objectiveData - Partial objective data to update
 * @returns Promise containing the API response
 */
export const updateExistingObjective = async (
  id: string,
  objectiveData: Partial<Objective>
): Promise<ApiResponse> => {
  const response = await api.put(`/api/objectives/${id}`, objectiveData);
  return response.data;
};

/**
 * Update a key result for an objective
 * @param id - The objective ID
 * @param keyResultData - Key result update data
 * @param keyResultData.keyResultId - The key result ID to update
 * @param keyResultData.currentValue - Optional current value
 * @param keyResultData.completed - Optional completion status
 * @returns Promise containing the API response
 */
export const updateObjectiveKeyResult = async (
  id: string,
  keyResultData: {
    keyResultId: string;
    currentValue?: number;
    completed?: boolean;
  }
): Promise<ApiResponse> => {
  const response = await api.put(
    `/api/objectives/${id}/key-results`,
    keyResultData
  );
  return response.data;
};

/**
 * Delete an objective
 * @param id - The objective ID to delete
 * @returns Promise containing the API response
 */
export const deleteObjective = async (id: string): Promise<ApiResponse> => {
  const response = await api.delete(`/api/objectives/${id}`);
  return response.data;
};

// ============================================================================
// TASK MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Get tasks for the authenticated user with optional filtering
 * @param filters - Optional filters to apply
 * @param filters.startDate - Filter by start date (YYYY-MM-DD)
 * @param filters.endDate - Filter by end date (YYYY-MM-DD)
 * @param filters.status - Filter by status
 * @param filters.priority - Filter by priority
 * @param filters.objectiveId - Filter by objective ID
 * @param filters.goalId - Filter by goal ID
 * @returns Promise containing the API response with tasks array
 * ```
 */
export const getAllTasks = async (
  filters: {
    startDate?: string;
    endDate?: string;
    status?: string;
    priority?: string;
    objectiveId?: string;
    goalId?: string;
  } = {}
): Promise<ApiResponse<{ tasks: Task[]; totalCount: number }>> => {
  console.log('API: Getting tasks with filters:', filters);
  
  // Only apply filters if they are explicitly provided
  const queryParams = new URLSearchParams();
  
  if (filters.startDate) queryParams.append('startDate', filters.startDate);
  if (filters.endDate) queryParams.append('endDate', filters.endDate);
  if (filters.status) queryParams.append('status', filters.status);
  if (filters.priority) queryParams.append('priority', filters.priority);
  if (filters.objectiveId) queryParams.append('objectiveId', filters.objectiveId);
  if (filters.goalId) queryParams.append('goalId', filters.goalId);

  const queryString = queryParams.toString();
  const url = queryString ? `/api/tasks?${queryString}` : '/api/tasks';
  
  console.log('API: Fetching from URL:', url);
  
  const response = await api.get(url);
  
  console.log('API: Tasks response:', response.data);
  
  return response.data;
};

/**
 * Get a specific task by its ID
 * @param id - The task ID
 * @returns Promise containing the API response with task data
 */
export const getTaskById = async (
  id: string
): Promise<ApiResponse<{ task: Task }>> => {
  const response = await api.get(`/api/tasks/${id}`);
  return response.data;
};

/**
 * Create a new task
 * @param taskData - The task data
 * @param taskData.objectiveId - Optional parent objective ID
 * @param taskData.goalId - Optional parent goal ID
 * @param taskData.title - Task title
 * @param taskData.description - Optional task description
 * @param taskData.scheduledDate - Scheduled date (YYYY-MM-DD)
 * @param taskData.scheduledTime - Optional scheduled time (HH:MM)
 * @param taskData.estimatedDuration - Optional estimated duration in minutes
 * @param taskData.priority - Priority level
 * @param taskData.tags - Optional tags array
 * @param taskData.location - Optional location
 * @param taskData.reminderMinutes - Optional reminder time in minutes
 * @returns Promise containing the API response with created task
 */
export const createNewTask = async (taskData: {
  objectiveId?: string;
  goalId?: string;
  title: string;
  description?: string;
  scheduledDate: string;
  scheduledTime?: string;
  estimatedDuration?: number;
  priority: string;
  tags?: string[];
  location?: string;
  reminderMinutes?: number;
}): Promise<ApiResponse<{ task: Task }>> => {
  const response = await api.post('/api/tasks', taskData);
  return response.data;
};

/**
 * Update an existing task
 * @param id - The task ID to update
 * @param taskData - Partial task data to update
 * @returns Promise containing the API response
 */
export const updateExistingTask = async (
  id: string,
  taskData: Partial<Task>
): Promise<ApiResponse> => {
  const response = await api.put(`/api/tasks/${id}`, taskData);
  return response.data;
};

/**
 * Mark a task as completed
 * @param id - The task ID to complete
 * @param actualDuration - Optional actual duration in minutes
 * @returns Promise containing the API response
 */
export const markTaskCompleted = async (
  id: string,
  actualDuration?: number
): Promise<ApiResponse> => {
  const response = await api.post(`/api/tasks/${id}/complete`, {
    actualDuration,
  });
  return response.data;
};

/**
 * Delete a task
 * @param id - The task ID to delete
 * @returns Promise containing the API response
 */
export const deleteTask = async (id: string): Promise<ApiResponse> => {
  const response = await api.delete(`/api/tasks/${id}`);
  return response.data;
};

/**
 * Get task completion statistics
 * @param filters - Optional filters to apply
 * @param filters.startDate - Filter by start date (YYYY-MM-DD)
 * @param filters.endDate - Filter by end date (YYYY-MM-DD)
 * @returns Promise containing the API response with completion statistics
 */
export const getTaskCompletionStatistics = async (filters?: {
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<{ stats: any }>> => {
  const response = await api.get('/api/tasks/stats/completion', {
    params: filters,
  });
  return response.data;
};

// ============================================================================
// AI SERVICES FUNCTIONS
// ============================================================================

/**
 * Decompose a goal into objectives using AI
 * @param goalId - The goal ID to decompose
 * @returns Promise containing the API response with generated objectives, reasoning, and confidence score
 */
export const decomposeGoalWithAI = async (
  goalId: string
): Promise<
  ApiResponse<{
    objectives: Objective[];
    reasoning: string;
    confidence: number;
  }>
> => {
  const response = await api.post('/api/ai/decompose-goal', { goalId });
  return response.data;
};

/**
 * Generate tasks for an objective using AI
 * @param objectiveId - The objective ID to generate tasks for
 * @param weekNumber - Optional week number for task generation
 * @returns Promise containing the API response with generated tasks, reasoning, and confidence score
 */
export const generateTasksWithAI = async (
  objectiveId: string,
  weekNumber?: number
): Promise<
  ApiResponse<{
    tasks: Task[];
    reasoning: string;
    confidence: number;
  }>
> => {
  const response = await api.post('/api/ai/generate-tasks', {
    objectiveId,
    weekNumber,
  });
  return response.data;
};

/**
 * Optimize schedule for a specific date using AI
 * @param date - The date to optimize (YYYY-MM-DD)
 * @param taskIds - Optional array of specific task IDs to optimize
 * @returns Promise containing the API response with optimized tasks, insights, and confidence score
 */
export const optimizeScheduleWithAI = async (
  date: string,
  taskIds?: string[]
): Promise<
  ApiResponse<{
    optimizedTasks: any[];
    insights: string[];
    confidence: number;
  }>
> => {
  const response = await api.post('/api/ai/optimize-schedule', {
    date,
    taskIds,
  });
  return response.data;
};

/**
 * Process natural language text using AI
 * @param text - The text to process
 * @param context - Optional context for processing
 * @returns Promise containing the API response with intent, entities, confidence, and response
 */
export const processNaturalLanguageWithAI = async (
  text: string,
  context?: any
): Promise<
  ApiResponse<{
    intent: string;
    entities: any;
    confidence: number;
    response: string;
  }>
> => {
  const response = await api.post('/api/ai/process-nl', { text, context });
  return response.data;
};

/**
 * Get AI-generated productivity insights
 * @returns Promise containing the API response with insights and overall productivity score
 */
export const getProductivityInsightsFromAI = async (): Promise<
  ApiResponse<{
    insights: any[];
    overall_productivity_score: number;
  }>
> => {
  const response = await api.get('/api/ai/productivity-insights');
  return response.data;
};

/**
 * Get smart recommendations from AI
 * @param type - The type of recommendation to get
 * @param context - Context for generating recommendations
 * @returns Promise containing the API response with recommendations
 */
export const getSmartRecommendationsFromAI = async (
  type: string,
  context: any
): Promise<ApiResponse> => {
  const response = await api.post('/api/ai/smart-recommendations', {
    type,
    context,
  });
  return response.data;
};

// ============================================================================
// NATURAL LANGUAGE PROCESSING FUNCTIONS
// ============================================================================

/**
 * Get command history for natural language processing
 * @param limit - Optional limit for number of commands to retrieve
 * @returns Promise containing the API response with commands array
 */
export const getNaturalLanguageCommands = async (
  limit?: number
): Promise<ApiResponse<{ commands: any[] }>> => {
  const response = await api.get('/api/nl/commands', { params: { limit } });
  return response.data;
};

/**
 * Process a natural language command using AI services
 * @param text - The natural language text to process
 * @param context - Optional context for processing
 * @returns Promise containing the API response with command, parsed data, and result
 */
export const processNaturalLanguageCommand = async (
  text: string,
  context?: any
): Promise<
  ApiResponse<{
    command: any;
    parsed: {
      intent: string;
      entities: any;
      confidence: number;
      response?: string;
    };
    execution?: any;
    result?: any; // Add this for backward compatibility
    response?: string;
  }>
> => {
  console.log('API: Processing NL command with AI:', text);
  
  // Use the AI-powered route instead of basic nl-commands
  const response = await api.post('/api/ai/process-nl', { 
    text,
    context 
  });
  
  console.log('API: AI NL command response:', response.data);
  
  return response.data;
};

// Keep the old function for backward compatibility but update it
export const processNaturalLanguageCommandBasic = async (
  text: string
): Promise<
  ApiResponse<{
    command: any;
    parsed: any;
    result: any;
  }>
> => {
  console.log('API: Processing NL command (basic):', text);
  
  const response = await api.post('/api/nl/process', { text });
  
  console.log('API: Basic NL command response:', response.data);
  
  return response.data;
};

/**
 * Retrieves active suggestions based on the conversation history
 */
  interface Suggestion {
    id: string;
    content: string;
    isActive: boolean;
    priority?: number;
    type?: string;
  }

  interface SuggestionsResponse {
    suggestions: Suggestion[];
    success: boolean;
    message?: string;
  }

export const getActiveSuggestions = async (): Promise<ApiResponse<SuggestionsResponse>> => {
  try {
    const res = await api.get(`/api/ambient-ai/suggestions`);
    return res.data.suggestions; // <-- Axios: use res.data, not res.json()
  } catch (error) {
    console.error('Failed to fetch suggestions:', error);
    throw error;
  }
}

// ============================================================================
// ENHANCED AI & VOICE PROCESSING FUNCTIONS
// ============================================================================

/**
 * Enhanced text-based AI conversation with fallback to nl-commands
 */
export const sendTextMessage = async (
  message: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<ApiResponse<{
  response: string;
  actionItems?: Array<{
    type: string;
    description: string;
    suggestedAction: string;
  }>;
  followUpQuestions?: string[];
  command?: any;
  parsed?: any;
  result?: any;
}>> => {
  console.log('API: Sending text message:', message);
  
  try {
    // First try the AI conversational assistant
    const response = await api.post('/api/ai/conversational-assistant', {
      message,
      conversationHistory: conversationHistory || []
    });
    
    console.log('API: AI response:', response.data);
    return response.data;
    
  } catch (error) {
    console.warn('AI conversational assistant failed, falling back to nl-commands:', error);
    
    // Fallback to nl-commands processing
    try {
      const nlResponse = await api.post('/api/nl/process', {
        text: message
      });
      
      console.log('API: NL fallback response:', nlResponse.data);
      
      // Transform nl-commands response to match expected format
      const transformedResponse = {
        success: nlResponse.data.success,
        data: {
          response: nlResponse.data.data.result?.message || 
                   `I processed your command: ${message}`,
          command: nlResponse.data.data.command,
          parsed: nlResponse.data.data.parsed,
          result: nlResponse.data.data.result,
          actionItems: nlResponse.data.data.result?.success ? [{
            type: nlResponse.data.data.parsed?.intent || 'general',
            description: nlResponse.data.data.result.message,
            suggestedAction: 'completed'
          }] : undefined
        },
        message: nlResponse.data.message
      };
      
      return transformedResponse;
      
    } catch (nlError) {
      console.error('Both AI and NL processing failed:', nlError);
      throw new Error('Failed to process message with both AI and NL services');
    }
  }
};

/**
 * Process voice command by uploading audio file
 * @param audioBlob - The audio blob to process
 * @param options - Processing options
 * @param options.executeCommand - Whether to execute the parsed command
 * @param options.language - Language for speech recognition (default: 'en')
 * @param options.context - Additional context for processing
 * @returns Promise containing the API response with transcription and execution results
 */
export const processVoiceCommand = async (
  audioBlob: Blob,
  options: {
    executeCommand?: boolean;
    language?: string;
    context?: any;
  } = {}
): Promise<ApiResponse<{
  transcript: string;
  confidence: number;
  language: string;
  duration: number;
  nlpResult?: {
    intent: string;
    entities: any;
    response: string;
    confidence: number;
  };
  executionResult?: {
    success: boolean;
    message: string;
    data?: any;
  };
  processingTime: number;
}>> => {
  console.log('API: Processing voice command:', {
    size: audioBlob.size,
    type: audioBlob.type,
    options
  });

  // Create FormData for file upload
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  formData.append('language', options.language || 'en');
  formData.append('executeCommand', String(options.executeCommand !== false));
  
  if (options.context) {
    formData.append('context', JSON.stringify(options.context));
  }

  try {
    console.log('form data' + formData.get('audio'));
    const response = await api.post('/api/voice/process-audio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 30 second timeout for voice processing
    });

    console.log('API: Voice processing response:', response.data);
    return response.data;

  } catch (error) {
    console.error('API: Voice processing error:', error);
    
    // Enhanced error handling for voice processing
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        throw new Error('Voice processing timed out. Please try with a shorter recording.');
      } else if (error.message.includes('413')) {
        throw new Error('Audio file is too large. Please try with a shorter recording.');
      } else if (error.message.includes('415')) {
        throw new Error('Unsupported audio format. Please try again.');
      } else if (error.message.includes('404')) {
        throw new Error('Voice processing service is temporarily unavailable.');
      }
    }
    
    throw error;
  }
};

/**
 * Process text command with enhanced error handling
 * @param text - The text command to process
 * @param options - Processing options
 * @param options.executeCommand - Whether to execute the parsed command
 * @param options.context - Additional context for processing
 * @returns Promise containing the API response with command processing results
 */
export const processTextCommand = async (
  text: string,
  options: {
    executeCommand?: boolean;
    context?: any;
  } = {}
): Promise<ApiResponse<{
  command: any;
  parsed: any;
  result: any;
}>> => {
  console.log('API: Processing text command:', text);
  
  // Use the working nl-commands route instead of ai route
  const response = await api.post('/api/nl/process', {
    text: text
  });
  
  console.log('API: Text command response:', response.data);
  
  return response.data;
};

/**
 * Get voice processing statistics and capabilities
 * @returns Promise containing the API response with voice service info
 */
export const getVoiceServiceInfo = async (): Promise<ApiResponse<{
  supportedLanguages: string[];
  maxDuration: number;
  maxFileSize: number;
  supportedFormats: string[];
}>> => {
  const response = await api.get('/api/voice/info');
  return response.data;
};

/**
 * Get voice command history
 * @param limit - Optional limit for number of commands to retrieve
 * @returns Promise containing the API response with voice commands array
 */
export const getVoiceCommandHistory = async (
  limit?: number
): Promise<ApiResponse<{ commands: any[] }>> => {
  const response = await api.get('/api/voice/commands/history', { 
    params: { limit } 
  });
  return response.data;
};

/**
 * Get voice usage analytics
 * @returns Promise containing voice analytics data
 */
export const getVoiceAnalytics = async (): Promise<ApiResponse<{
  totalCommands: number;
  averageConfidence: number;
  mostUsedIntents: string[];
  preferredLanguage?: string;
  successRate: number;
  averageProcessingTime: number;
}>> => {
  const response = await api.get('/api/voice/analytics');
  return response.data;
};

/**
 * Test voice processing service connection
 * @returns Promise containing service status
 */
export const testVoiceConnection = async (): Promise<ApiResponse<{
  whisperAPI: boolean;
  uploadDirectory: boolean;
  supportedFormats: string[];
  maxFileSize: string;
  status: string;
}>> => {
  const response = await api.post('/api/voice/test-connection');
  return response.data;
};

/**
 * Transcribe audio without executing commands
 * @param audioBlob - The audio blob to transcribe
 * @param language - Optional language code
 * @returns Promise containing transcription result
 */
export const transcribeAudio = async (
  audioBlob: Blob,
  language?: string
): Promise<ApiResponse<{
  transcript: string;
  confidence: number;
  language: string;
}>> => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  if (language) {
    formData.append('language', language);
  }

  const response = await api.post('/api/voice/transcribe-only', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};
