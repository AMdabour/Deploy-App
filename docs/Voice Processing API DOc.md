## Voice Processing Routes

### POST /api/voice/process-audio
**Description:** Process audio file with speech-to-text and natural language understanding

**Headers:** Requires authentication
**Content-Type:** multipart/form-data

**Form Data:**
- `audio`: Audio file (mp3, wav, webm, m4a, mp4) - max 25MB
- `language`: Optional language code (e.g., 'en', 'es', 'fr')
- `executeCommand`: Boolean - whether to execute the parsed command
- `context`: Optional JSON context for better NLP understanding

**Response:**
```json
{
  "success": true,
  "data": {
    "transcript": "Schedule a meeting with John tomorrow at 2 PM",
    "confidence": 0.95,
    "language": "en",
    "duration": 3.2,
    "nlpResult": {
      "intent": "add_task",
      "entities": {
        "title": "meeting with John",
        "date": "tomorrow",
        "time": "14:00"
      },
      "confidence": 0.89
    },
    "executionResult": {
      "success": true,
      "message": "Created task: meeting with John",
      "data": { "taskId": "uuid" }
    },
    "processingTime": 1250
  },
  "message": "Voice command processed successfully"
}
```

### POST /api/voice/transcribe-only
**Description:** Transcribe audio to text without command execution

### GET /api/voice/commands/history
**Description:** Get voice command history

### GET /api/voice/analytics
**Description:** Get voice usage analytics and patterns

### POST /api/voice/test-connection
**Description:** Test voice processing service availability