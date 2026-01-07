# Gemini Agent Configuration

This document describes the configuration, capabilities, and usage patterns for Google Gemini AI agents within the AI Orchestrator Platform.

## Overview

Gemini agents leverage Google's Gemini models for multi-modal understanding, reasoning, and generation tasks. Gemini excels at processing multiple modalities (text, images, video, audio), long-context understanding, and integrated tool use.

## Model Variants

### Gemini 2.0 Flash (Recommended)

**Best for**: Fast, efficient multi-modal tasks

**Capabilities**:
- 1M token context window
- Multi-modal input (text, image, video, audio)
- Native tool/function calling
- Code execution
- Fast response times
- Native image generation

**Use Cases**:
- Real-time applications
- Multi-modal content analysis
- Interactive agents with tools
- Code generation and execution
- Vision and audio tasks

**Configuration**:
```javascript
{
  model: "gemini-2.0-flash-exp",
  maxTokens: 8192,
  temperature: 1.0,
  topP: 0.95,
  topK: 40,
  safetySettings: [...]
}
```

### Gemini 1.5 Pro

**Best for**: Complex reasoning and long context

**Capabilities**:
- 2M token context window (longest available)
- Advanced multi-modal understanding
- Superior reasoning capabilities
- Complex multi-step tasks
- Document and video analysis

**Use Cases**:
- Long document analysis
- Video content understanding
- Complex research tasks
- Multi-document reasoning
- Large-scale code analysis

**Configuration**:
```javascript
{
  model: "gemini-1.5-pro-latest",
  maxTokens: 8192,
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  safetySettings: [...]
}
```

### Gemini 1.5 Flash

**Best for**: Speed and efficiency

**Capabilities**:
- 1M token context window
- Fast inference
- Multi-modal support
- Cost-effective
- Good quality/speed balance

**Use Cases**:
- High-throughput applications
- Real-time interactions
- Chat applications
- Quick analysis tasks
- Batch processing

**Configuration**:
```javascript
{
  model: "gemini-1.5-flash-latest",
  maxTokens: 8192,
  temperature: 1.0,
  topP: 0.95,
  topK: 40,
  safetySettings: [...]
}
```

## Input Format

Gemini agents accept multi-modal input:

```javascript
{
  contents: [
    {
      role: "user" | "model",
      parts: [
        { text: "Your text here" },
        { inlineData: { mimeType: "image/jpeg", data: "base64..." } },
        { fileData: { mimeType: "video/mp4", fileUri: "gs://..." } }
      ]
    }
  ],
  systemInstruction?: {
    parts: [{ text: "System prompt" }]
  },
  generationConfig?: {
    temperature: number,
    topP: number,
    topK: number,
    maxOutputTokens: number,
    stopSequences: string[]
  },
  safetySettings?: SafetySetting[],
  tools?: Tool[]
}
```

### Multi-Modal Content Types

**Text**:
```javascript
{ text: "Analyze this data..." }
```

**Image** (inline):
```javascript
{
  inlineData: {
    mimeType: "image/jpeg" | "image/png" | "image/webp",
    data: "base64-encoded-image"
  }
}
```

**Image** (URL):
```javascript
{
  fileData: {
    mimeType: "image/jpeg",
    fileUri: "https://example.com/image.jpg"
  }
}
```

**Video**:
```javascript
{
  fileData: {
    mimeType: "video/mp4" | "video/mpeg" | "video/mov" | "video/avi",
    fileUri: "gs://bucket/video.mp4"
  }
}
```

**Audio**:
```javascript
{
  fileData: {
    mimeType: "audio/wav" | "audio/mp3" | "audio/aac",
    fileUri: "gs://bucket/audio.mp3"
  }
}
```

**PDF**:
```javascript
{
  fileData: {
    mimeType: "application/pdf",
    fileUri: "gs://bucket/document.pdf"
  }
}
```

## Output Format

Gemini returns structured responses:

```javascript
{
  candidates: [
    {
      content: {
        role: "model",
        parts: [
          { text: "Response text..." },
          { functionCall: { name: "...", args: {...} } }
        ]
      },
      finishReason: "STOP" | "MAX_TOKENS" | "SAFETY" | "RECITATION" | "OTHER",
      safetyRatings: [
        {
          category: "HARM_CATEGORY_*",
          probability: "NEGLIGIBLE" | "LOW" | "MEDIUM" | "HIGH"
        }
      ],
      citationMetadata?: {
        citations: [{ startIndex: number, endIndex: number, uri: string }]
      }
    }
  ],
  usageMetadata: {
    promptTokenCount: number,
    candidatesTokenCount: number,
    totalTokenCount: number
  }
}
```

## Decision Logic

### Task Classification

Gemini agents classify tasks by modality and complexity:

1. **Text-Only Tasks**
   - Simple Q&A → Gemini 1.5 Flash
   - Complex reasoning → Gemini 1.5 Pro
   - Real-time chat → Gemini 2.0 Flash

2. **Vision Tasks**
   - Image analysis → Gemini 2.0 Flash
   - Multiple images → Gemini 1.5 Pro
   - Video understanding → Gemini 1.5 Pro

3. **Audio Tasks**
   - Audio transcription → Gemini 2.0 Flash
   - Audio analysis → Gemini 1.5 Pro

4. **Multi-Modal Tasks**
   - Text + Image → Gemini 2.0 Flash
   - Text + Video → Gemini 1.5 Pro
   - Complex multi-modal → Gemini 1.5 Pro

### Routing Matrix

| Task Type | Context Size | Model | Reason |
|-----------|--------------|-------|--------|
| Simple Text | <10K tokens | Flash | Speed |
| Complex Text | <100K tokens | Flash | Efficiency |
| Very Long Context | >100K tokens | Pro 1.5 | Context capacity |
| Image Analysis | Any | Flash 2.0 | Multi-modal |
| Video Analysis | Any | Pro 1.5 | Video capability |
| Tool Usage | Any | Flash 2.0 | Native tools |
| Real-time | Any | Flash 2.0 | Latency |

### Confidence Scoring

Gemini provides built-in safety ratings that can be interpreted as confidence:

```javascript
function calculateConfidence(candidate) {
  const safetyScore = calculateSafetyScore(candidate.safetyRatings);
  const finishScore = candidate.finishReason === 'STOP' ? 1.0 : 0.5;
  const citationScore = candidate.citationMetadata ? 0.9 : 0.7;
  
  return {
    overall: (safetyScore + finishScore + citationScore) / 3,
    safety: safetyScore,
    completion: finishScore,
    grounded: citationScore
  };
}
```

## Tool Use (Function Calling)

Gemini has native function calling capabilities:

### Tool Definition

```javascript
{
  tools: [
    {
      functionDeclarations: [
        {
          name: "get_weather",
          description: "Get current weather for a location",
          parameters: {
            type: "object",
            properties: {
              location: {
                type: "string",
                description: "City name or coordinates"
              },
              unit: {
                type: "string",
                enum: ["celsius", "fahrenheit"]
              }
            },
            required: ["location"]
          }
        },
        {
          name: "search_database",
          description: "Search the knowledge database",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string" },
              maxResults: { type: "integer" }
            },
            required: ["query"]
          }
        }
      ]
    }
  ]
}
```

### Tool Execution Flow

1. User provides input with tool availability
2. Gemini decides if a tool is needed
3. Gemini returns function call request
4. Application executes function
5. Result sent back to Gemini
6. Gemini generates final response

```javascript
// Initial request
const response1 = await gemini.generateContent({
  contents: [{ role: "user", parts: [{ text: "What's the weather in Paris?" }] }],
  tools: [weatherTool]
});

// Check for function call
if (response1.functionCall) {
  const result = await executeFunction(response1.functionCall);
  
  // Send function result back
  const response2 = await gemini.generateContent({
    contents: [
      { role: "user", parts: [{ text: "What's the weather in Paris?" }] },
      { role: "model", parts: [{ functionCall: response1.functionCall }] },
      { role: "function", parts: [{ functionResponse: { name: "get_weather", response: result } }] }
    ]
  });
}
```

### Code Execution

Gemini 2.0 can execute Python code directly:

```javascript
{
  tools: [
    {
      codeExecution: {}
    }
  ]
}
```

This enables:
- Data analysis and visualization
- Mathematical calculations
- File processing
- API calls from generated code

## Prompt Engineering

### System Instructions

Gemini uses system instructions separate from conversation:

**Code Generation**:
```
You are an expert programmer. Write clean, efficient code with proper error handling. Explain your implementation choices. Test edge cases.
```

**Multi-Modal Analysis**:
```
You are a visual analysis expert. Describe images in detail, identifying objects, text, emotions, and context. Provide structured insights.
```

**Tool-Using Agent**:
```
You are a helpful assistant with access to tools. Use available functions when needed to provide accurate, up-to-date information. Always verify tool results before responding.
```

### Few-Shot Examples

Structure examples in conversation format:

```javascript
{
  contents: [
    { role: "user", parts: [{ text: "Extract entities: Apple announces iPhone 15" }] },
    { role: "model", parts: [{ text: '{"company": "Apple", "product": "iPhone 15", "action": "announces"}' }] },
    { role: "user", parts: [{ text: "Extract entities: Microsoft launches Azure AI" }] }
  ]
}
```

### Multi-Modal Prompting

Combine text and images effectively:

```javascript
{
  contents: [
    {
      role: "user",
      parts: [
        { text: "Analyze this diagram and explain the architecture:" },
        { inlineData: { mimeType: "image/png", data: base64Image } },
        { text: "Focus on the data flow and component interactions." }
      ]
    }
  ]
}
```

## Safety Settings

Configure content filtering:

```javascript
{
  safetySettings: [
    {
      category: "HARM_CATEGORY_HARASSMENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
      category: "HARM_CATEGORY_HATE_SPEECH",
      threshold: "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
      category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
      category: "HARM_CATEGORY_DANGEROUS_CONTENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE"
    }
  ]
}
```

**Thresholds**:
- `BLOCK_NONE`: No blocking
- `BLOCK_LOW_AND_ABOVE`: Block low probability and above
- `BLOCK_MEDIUM_AND_ABOVE`: Block medium probability and above (default)
- `BLOCK_ONLY_HIGH`: Block only high probability

## Integration Patterns

### Streaming Responses

Stream responses for real-time UX:

```javascript
const stream = model.generateContentStream({
  contents: [{ role: "user", parts: [{ text: prompt }] }]
});

for await (const chunk of stream.stream) {
  const text = chunk.text();
  process(text);
}
```

### Caching (Context Caching)

Cache large contexts for repeated use:

```javascript
{
  cachedContent: {
    name: "cached-content-id",
    model: "gemini-1.5-pro-latest",
    systemInstruction: { parts: [{ text: "Large system prompt..." }] },
    contents: [
      // Large context to cache
    ],
    ttl: "3600s"
  }
}
```

### Batch Requests

Process multiple requests efficiently:

```javascript
const requests = prompts.map(prompt => ({
  contents: [{ role: "user", parts: [{ text: prompt }] }]
}));

const results = await Promise.all(
  requests.map(req => model.generateContent(req))
);
```

## Error Handling

### Common Errors

1. **Content Filtered**
   - Reason: Safety threshold exceeded
   - Solution: Adjust safety settings or rephrase input

2. **Context Length Exceeded**
   - Reason: Input too long for model
   - Solution: Truncate or summarize input

3. **Rate Limit**
   - Reason: Too many requests
   - Solution: Implement backoff and queuing

4. **Invalid Media**
   - Reason: Unsupported format or corrupted file
   - Solution: Validate and convert media

### Retry Strategy

```javascript
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const backoffMs = Math.min(1000 * Math.pow(2, i), 10000);
      
      if (error.code === 429 || error.code === 503) {
        await sleep(backoffMs);
      } else {
        throw error;
      }
    }
  }
}
```

## Performance Optimization

### Token Management

Optimize token usage:
1. **Concise prompts**: Remove redundancy
2. **Structured output**: Use JSON mode
3. **Stop sequences**: Terminate early
4. **Context caching**: Cache repeated content

### Latency Reduction

Improve response time:
1. **Model selection**: Use Flash for speed
2. **Streaming**: Progressive rendering
3. **Caching**: Reduce repeated processing
4. **Regional endpoints**: Use nearest region

### Multi-Modal Optimization

Handle media efficiently:
1. **Image compression**: Reduce file size
2. **Video sampling**: Extract key frames
3. **Audio preprocessing**: Remove silence
4. **Batch processing**: Group similar media

## Cost Management

Control costs effectively:

| Model | Input Price | Output Price | Context | Use When |
|-------|-------------|--------------|---------|----------|
| Flash 2.0 | $0.0001/1K | $0.0004/1K | 1M | Real-time, tools |
| Flash 1.5 | $0.000075/1K | $0.0003/1K | 1M | High volume |
| Pro 1.5 | $0.00125/1K | $0.005/1K | 2M | Complex tasks |

**Cost Optimization**:
1. Use Flash models for simple tasks
2. Cache frequently used contexts
3. Batch similar requests
4. Set appropriate max tokens
5. Monitor usage by use case

## Monitoring and Metrics

Track key metrics:

```javascript
{
  model: "gemini-2.0-flash-exp",
  tokens: {
    input: 1234,
    output: 567,
    total: 1801,
    cached: 800  // Cached tokens
  },
  latency: {
    timeToFirstToken: 234,  // ms
    totalTime: 1456         // ms
  },
  safety: {
    blocked: false,
    categories: [...]
  },
  quality: {
    userFeedback: "positive",
    groundedness: 0.95
  }
}
```

## Best Practices

1. **Multi-Modal Design**: Leverage image/video capabilities
2. **Tool Integration**: Use native function calling
3. **Context Caching**: Cache large static contexts
4. **Safety Configuration**: Set appropriate thresholds
5. **Error Handling**: Handle content filtering gracefully
6. **Testing**: Test with diverse inputs and modalities
7. **Monitoring**: Track performance and quality
8. **Cost Control**: Choose appropriate models

## Advanced Features

### Grounding with Google Search

Ground responses in real-time search results:

```javascript
{
  tools: [
    {
      googleSearchRetrieval: {
        dynamicRetrievalConfig: {
          mode: "MODE_DYNAMIC",
          dynamicThreshold: 0.7
        }
      }
    }
  ]
}
```

### JSON Mode

Force structured JSON output:

```javascript
{
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "integer" }
      },
      required: ["name"]
    }
  }
}
```

### Multi-Turn Conversations

Maintain conversation context:

```javascript
const chat = model.startChat({
  history: [
    { role: "user", parts: [{ text: "Hello" }] },
    { role: "model", parts: [{ text: "Hi! How can I help?" }] }
  ]
});

const response = await chat.sendMessage("Tell me about AI");
```

## Related Documentation

- [agents.md](./agents.md) - General agent architecture
- [claude.md](./claude.md) - Claude agent configuration
- [PRD.md](./PRD.md) - Product requirements
- [TECHNICAL_AUDIT.md](./TECHNICAL_AUDIT.md) - Technical details

## External Resources

- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Gemini Cookbook](https://github.com/google-gemini/cookbook)
- [Model Comparison](https://ai.google.dev/models/gemini)
