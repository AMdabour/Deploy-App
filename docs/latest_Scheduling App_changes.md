# Scheduling App

A comprehensive AI-powered scheduling and productivity application that helps users manage goals, objectives, and tasks with intelligent automation and personalization.

## Features

### Core Functionality
- **Goal Management**: Create and track long-term goals with AI-powered decomposition
- **Objective Management**: Break down goals into monthly objectives with key results
- **Task Management**: Manage daily tasks with intelligent scheduling and optimization
- **User Profiles**: Personalized user experience with preferences and analytics

### AI-Powered Features
- **Multi-Provider AI Support**: Switch between OpenAI and Gemini AI providers
- **Automatic Fallback**: Seamless switching between AI providers when one fails
- **Goal Decomposition**: AI automatically breaks down goals into actionable monthly objectives
- **Task Generation**: Generate weekly tasks from objectives using AI
- **Schedule Optimization**: AI-powered schedule optimization based on energy patterns
- **Natural Language Processing**: Process commands in natural language
- **Productivity Insights**: AI-generated insights about productivity patterns
- **Smart Recommendations**: Context-aware suggestions for better productivity

### Advanced AI Features
- **Ambient AI Learning**: Continuous learning from user behavior patterns
- **Visual Analysis**: Workspace analysis using Gemini's multimodal capabilities (Gemini only)
- **Conversational Memory**: Enhanced context retention for better suggestions (Gemini only)
- **Proactive Suggestions**: AI-generated suggestions based on user patterns
- **Personalization Engine**: Adaptive personalization based on user feedback

### Personalization
- **Behavioral Analysis**: Learn from user patterns and preferences
- **Contextual Suggestions**: Generate suggestions based on current context
- **Energy Pattern Recognition**: Optimize scheduling based on energy levels
- **Feedback Learning**: Adapt recommendations based on user feedback
- **Work Style Analysis**: Understand and adapt to individual work styles

## API Documentation

### AI Services Routes

#### Provider Management
- `GET /api/ai/provider/status` - Get current AI provider and capabilities
- `POST /api/ai/provider/switch` - Switch between OpenAI and Gemini
- `GET /api/ai/provider/test` - Test AI provider connectivity

#### Core AI Features
- `POST /api/ai/decompose-goal` - AI-powered goal decomposition
- `POST /api/ai/generate-tasks` - Generate tasks from objectives
- `POST /api/ai/optimize-schedule` - Optimize task scheduling
- `POST /api/ai/process-nl` - Process natural language commands
- `GET /api/ai/productivity-insights` - Generate productivity insights
- `POST /api/ai/smart-recommendations` - Get contextual recommendations

### Ambient AI Routes

#### Proactive Suggestions
- `GET /api/ambient-ai/suggestions` - Get AI-generated proactive suggestions
- `POST /api/ambient-ai/suggestions/:id/apply` - Apply a suggestion
- `POST /api/ambient-ai/suggestions/:id/dismiss` - Dismiss a suggestion

#### Learning Management
- `POST /api/ambient-ai/start-learning` - Start ambient learning
- `POST /api/ambient-ai/stop-learning` - Stop ambient learning
- `GET /api/ambient-ai/capabilities` - Get AI provider capabilities

#### Advanced Features (Gemini Only)
- `POST /api/ambient-ai/visual-analysis` - Analyze workspace visually
- `POST /api/ambient-ai/add-conversation` - Add conversation to memory

### Personalization Routes

#### Profile Management
- `GET /api/personalization/profile` - Get personalization profile
- `POST /api/personalization/profile/refresh` - Refresh profile analysis
- `POST /api/personalization/preferences` - Update preferences

#### Recommendations
- `GET /api/personalization/recommendations` - Get personalized recommendations
- `POST /api/personalization/contextual-suggestions` - Generate contextual suggestions
- `POST /api/personalization/goal-decomposition/:goalId` - Personalized goal decomposition

#### Analytics & Feedback
- `POST /api/personalization/feedback` - Record feedback on suggestions
- `GET /api/personalization/analytics` - Get personalization analytics
- `GET /api/personalization/insights` - Get personalization insights

### Natural Language Processing
- `GET /api/nl/commands` - Get command history
- `POST /api/nl/process` - Process natural language commands

### Traditional Routes
- **Authentication**: `/api/auth/*` - User registration, login, logout
- **User Management**: `/api/users/*` - Profile management and statistics
- **Goal Management**: `/api/goals/*` - CRUD operations for goals
- **Objective Management**: `/api/objectives/*` - CRUD operations for objectives
- **Task Management**: `/api/tasks/*` - CRUD operations for tasks
- **Suggestions**: `/api/suggestions/*` - Suggestion management

## Technology Stack

### Backend
- **Node.js** with **TypeScript**
- **Express.js** for API server
- **Session-based authentication** with cookies
- **Zod** for request validation
- **UUID** for unique identifiers

### AI Integration
- **OpenAI GPT-4** for natural language processing and task generation
- **Google Gemini 2.0** for enhanced multimodal capabilities
- **AI Factory Pattern** for provider abstraction and fallback
- **Automatic Provider Selection** based on availability and performance

### Storage
- **Custom storage abstraction** supporting multiple backends
- **Structured data models** for goals, objectives, tasks, and insights
- **User preference and analytics storage**

### AI Features Architecture
- **AI Service Factory**: Centralized AI provider management
- **Ambient AI Service**: Continuous learning and proactive suggestions
- **Personalization Engine**: User behavior analysis and adaptation
- **Natural Language Processor**: Command interpretation and execution

## Environment Variables

```bash
# AI Provider Configuration
AI_PROVIDER=gemini                    # openai or gemini
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=4096
OPENAI_TEMPERATURE=0.7

GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.0-flash-exp
GEMINI_VISION_MODEL=gemini-2.0-flash-exp
GEMINI_MAX_TOKENS=8192
GEMINI_TEMPERATURE=0.7

# Server Configuration
PORT=3000
SESSION_SECRET=your_session_secret
NODE_ENV=development
```

## AI Provider Comparison

| Feature | OpenAI | Gemini |
|---------|--------|--------|
| Natural Language Processing | ✅ | ✅ |
| Goal Decomposition | ✅ | ✅ |
| Task Generation | ✅ | ✅ |
| Schedule Optimization | ✅ | ✅ |
| Productivity Insights | ✅ | ✅ |
| Visual Analysis | ❌ | ✅ |
| Conversational Memory | ❌ | ✅ |
| Multimodal Capabilities | ❌ | ✅ |
| Enhanced Context | ❌ | ✅ |

## Getting Started

1. **Clone the repository**
2. **Install dependencies**: `npm install`
3. **Set up environment variables** (see above)
4. **Configure AI providers** with valid API keys
5. **Start the server**: `npm start`
6. **Access the API** at `http://localhost:3000`

## AI Integration Highlights

### Intelligent Goal Decomposition
The app uses AI to automatically break down high-level goals into actionable monthly objectives with specific key results and timelines.

### Adaptive Task Generation
AI generates weekly tasks from objectives, considering user preferences, energy patterns, and historical performance.

### Smart Scheduling
The system optimizes task scheduling based on:
- User energy patterns (morning, afternoon, evening)
- Task priority and estimated duration
- Historical completion patterns
- Current workload and availability

### Proactive Suggestions
Ambient AI continuously monitors user behavior and proactively suggests:
- Schedule optimizations
- Task prioritization changes
- Energy level alignments
- Productivity improvements

### Personalization Learning
The system learns from user interactions to:
- Improve suggestion accuracy
- Adapt to changing preferences
- Optimize scheduling algorithms
- Provide better productivity insights

## Rate Limits

- **General endpoints**: 100 requests/minute
- **AI-powered endpoints**: 10 requests/minute
- **Intensive operations**: 5 requests/minute

## Error Handling

All endpoints return consistent error responses:
```json
{
  "success": false,
  "error": "Descriptive error message"
}
```

## Contributing

1. Follow TypeScript best practices
2. Use Zod for request validation
3. Implement proper error handling
4. Add AI provider fallback support
5. Test with both OpenAI and Gemini providers

For detailed API documentation, see [API Documentation](Scheduling%20App%20API%20Documentation.md).