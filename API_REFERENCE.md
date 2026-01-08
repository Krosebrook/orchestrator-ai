# API Reference
## AI Orchestrator Platform

**Version:** 1.0  
**Last Updated:** January 8, 2026  
**Status:** Active  
**Owner:** API Team  
**API Version:** v1

---

## 1. Overview

This document provides a comprehensive reference for the AI Orchestrator Platform's API endpoints, authentication methods, request/response formats, and interaction patterns. The platform uses the Base44 SDK for backend communication.

### 1.1 Base URL

```
Development:  https://dev-api.base44.io/apps/{appId}
Production:   https://api.base44.io/apps/{appId}
```

### 1.2 API Principles

- **RESTful Design**: Resources accessed via standard HTTP methods
- **JSON Format**: All requests and responses use JSON
- **Authentication**: JWT tokens for secure access
- **Versioning**: API version specified in URL path
- **Rate Limiting**: Enforced based on user tier
- **Pagination**: Cursor-based for large datasets
- **Error Handling**: Consistent error response format

---

## 2. Authentication

### 2.1 Client Setup

```javascript
// src/api/base44Client.js
import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion } = appParams;

export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false
});
```

### 2.2 Authentication Endpoints

#### POST /auth/login

**Description**: Authenticate user and obtain JWT token

**Request**:
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response** (200 OK):
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "developer"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_abc123",
  "expiresIn": 900
}
```

**Errors**:
- `401 Unauthorized`: Invalid credentials
- `429 Too Many Requests`: Rate limit exceeded

#### POST /auth/refresh

**Description**: Refresh expired access token

**Request**:
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh_token_abc123"
}
```

**Response** (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

#### POST /auth/logout

**Description**: Invalidate current session

**Request**:
```http
POST /auth/logout
Authorization: Bearer {token}
```

**Response** (204 No Content)

### 2.3 Using Authentication Tokens

All authenticated requests must include the JWT token:

```http
GET /api/v1/agents
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**JavaScript Example**:
```javascript
// Using Base44 SDK (automatic token management)
const agents = await base44.data.list('Agent');

// Using fetch with manual token
const response = await fetch('/api/v1/agents', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

---

## 3. Data API (Base44 SDK)

### 3.1 Base44 Data Operations

The platform uses Base44 SDK for CRUD operations on all entities.

#### List Entities

**Method**: `base44.data.list(entityName, options?)`

**Parameters**:
- `entityName` (string): Name of entity type (e.g., 'Agent', 'Workflow')
- `options` (object, optional):
  - `where` (object): Filter conditions
  - `orderBy` (object): Sort order
  - `limit` (number): Max results (default: 50, max: 100)
  - `offset` (number): Skip N results

**Example**:
```javascript
// List all active agents
const agents = await base44.data.list('Agent', {
  where: { status: 'active' },
  orderBy: { createdAt: 'desc' },
  limit: 10
});

// List workflows for specific user
const workflows = await base44.data.list('Workflow', {
  where: {
    userId: 'user_123',
    status: { in: ['active', 'draft'] }
  }
});
```

**Response**:
```json
[
  {
    "id": "agent_abc123",
    "name": "Customer Support Agent",
    "status": "active",
    "capabilities": ["chat", "email"],
    "createdAt": "2026-01-08T10:00:00Z"
  },
  {
    "id": "agent_def456",
    "name": "Analytics Agent",
    "status": "active",
    "capabilities": ["data-analysis"],
    "createdAt": "2026-01-07T15:30:00Z"
  }
]
```

#### Get Single Entity

**Method**: `base44.data.get(entityName, id)`

**Parameters**:
- `entityName` (string): Entity type
- `id` (string): Entity ID

**Example**:
```javascript
const agent = await base44.data.get('Agent', 'agent_abc123');
```

**Response**:
```json
{
  "id": "agent_abc123",
  "name": "Customer Support Agent",
  "description": "Handles customer inquiries and support tickets",
  "status": "active",
  "capabilities": ["chat", "email", "ticket-management"],
  "configuration": {
    "model": "gpt-4",
    "temperature": 0.7
  },
  "createdAt": "2026-01-08T10:00:00Z",
  "updatedAt": "2026-01-08T14:30:00Z"
}
```

**Errors**:
- `404 Not Found`: Entity doesn't exist
- `403 Forbidden`: Insufficient permissions

#### Create Entity

**Method**: `base44.data.create(entityName, data)`

**Parameters**:
- `entityName` (string): Entity type
- `data` (object): Entity data

**Example**:
```javascript
const newAgent = await base44.data.create('Agent', {
  name: 'Sales Assistant',
  description: 'AI agent for sales support',
  status: 'draft',
  capabilities: ['lead-qualification', 'scheduling']
});
```

**Response**:
```json
{
  "id": "agent_xyz789",
  "name": "Sales Assistant",
  "description": "AI agent for sales support",
  "status": "draft",
  "capabilities": ["lead-qualification", "scheduling"],
  "createdAt": "2026-01-08T15:45:00Z",
  "updatedAt": "2026-01-08T15:45:00Z"
}
```

**Errors**:
- `400 Bad Request`: Invalid data format
- `403 Forbidden`: Insufficient permissions
- `422 Unprocessable Entity`: Validation failed

#### Update Entity

**Method**: `base44.data.update(entityName, id, data)`

**Parameters**:
- `entityName` (string): Entity type
- `id` (string): Entity ID
- `data` (object): Fields to update

**Example**:
```javascript
const updated = await base44.data.update('Agent', 'agent_abc123', {
  status: 'active',
  configuration: {
    model: 'gpt-4-turbo',
    temperature: 0.8
  }
});
```

**Response**:
```json
{
  "id": "agent_abc123",
  "name": "Customer Support Agent",
  "status": "active",
  "configuration": {
    "model": "gpt-4-turbo",
    "temperature": 0.8
  },
  "updatedAt": "2026-01-08T16:00:00Z"
}
```

#### Delete Entity

**Method**: `base44.data.delete(entityName, id)`

**Parameters**:
- `entityName` (string): Entity type
- `id` (string): Entity ID

**Example**:
```javascript
await base44.data.delete('Agent', 'agent_xyz789');
```

**Response**: (204 No Content)

**Errors**:
- `404 Not Found`: Entity doesn't exist
- `403 Forbidden`: Insufficient permissions
- `409 Conflict`: Entity has dependencies

---

## 4. Core Entity Endpoints

### 4.1 Agents

**Entity Name**: `Agent`

**Schema**:
```typescript
{
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'inactive' | 'archived';
  capabilities: string[];
  configuration: {
    model: string;
    temperature: number;
    maxTokens?: number;
  };
  userId: string;
  organizationId: string;
  createdAt: string (ISO 8601);
  updatedAt: string (ISO 8601);
}
```

**Common Operations**:
```javascript
// List all agents
const agents = await base44.data.list('Agent');

// Get active agents
const activeAgents = await base44.data.list('Agent', {
  where: { status: 'active' }
});

// Create agent
const agent = await base44.data.create('Agent', {
  name: 'New Agent',
  status: 'draft',
  capabilities: ['chat']
});

// Update agent status
await base44.data.update('Agent', agentId, {
  status: 'active'
});

// Delete agent
await base44.data.delete('Agent', agentId);
```

### 4.2 Workflows

**Entity Name**: `Workflow`

**Schema**:
```typescript
{
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  triggers: Trigger[];
  schedule?: CronExpression;
  userId: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}
```

**Common Operations**:
```javascript
// List workflows
const workflows = await base44.data.list('Workflow', {
  where: { userId: currentUser.id },
  orderBy: { updatedAt: 'desc' }
});

// Get workflow details
const workflow = await base44.data.get('Workflow', workflowId);

// Create workflow
const newWorkflow = await base44.data.create('Workflow', {
  name: 'Customer Onboarding',
  status: 'draft',
  nodes: [...],
  edges: [...]
});

// Execute workflow
const execution = await base44.functions.call('executeWorkflow', {
  workflowId: workflow.id,
  inputs: { customerId: 'cust_123' }
});
```

### 4.3 Workflow Executions

**Entity Name**: `WorkflowExecution`

**Schema**:
```typescript
{
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  inputs: object;
  outputs?: object;
  logs: ExecutionLog[];
  error?: string;
}
```

**Common Operations**:
```javascript
// List executions for workflow
const executions = await base44.data.list('WorkflowExecution', {
  where: { workflowId: workflow.id },
  orderBy: { startedAt: 'desc' },
  limit: 20
});

// Get execution status
const execution = await base44.data.get('WorkflowExecution', executionId);

// Cancel execution
await base44.functions.call('cancelWorkflowExecution', {
  executionId: execution.id
});
```

### 4.4 Integrations

**Entity Name**: `Integration`

**Schema**:
```typescript
{
  id: string;
  name: string;
  type: 'api' | 'webhook' | 'database' | 'service';
  provider: string; // e.g., 'salesforce', 'slack', 'stripe'
  status: 'connected' | 'disconnected' | 'error';
  configuration: {
    apiKey?: string;
    webhookUrl?: string;
    credentials?: object;
  };
  userId: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}
```

**Common Operations**:
```javascript
// List integrations
const integrations = await base44.data.list('Integration', {
  where: { status: 'connected' }
});

// Create integration
const integration = await base44.data.create('Integration', {
  name: 'Slack Workspace',
  type: 'service',
  provider: 'slack',
  configuration: {
    apiKey: 'xoxb-...'
  }
});

// Test integration
const testResult = await base44.functions.call('testIntegration', {
  integrationId: integration.id
});
```

### 4.5 Orchestrations

**Entity Name**: `AgentOrchestration`

**Schema**:
```typescript
{
  id: string;
  name: string;
  description?: string;
  agents: string[]; // Array of agent IDs
  strategy: 'sequential' | 'parallel' | 'conditional';
  configuration: {
    handoffRules?: HandoffRule[];
    failureHandling?: string;
  };
  status: 'active' | 'inactive';
  userId: string;
  createdAt: string;
  updatedAt: string;
}
```

**Common Operations**:
```javascript
// List orchestrations
const orchestrations = await base44.data.list('AgentOrchestration');

// Create orchestration
const orchestration = await base44.data.create('AgentOrchestration', {
  name: 'Customer Service Flow',
  agents: ['agent_1', 'agent_2', 'agent_3'],
  strategy: 'conditional',
  status: 'active'
});

// Execute orchestration
const result = await base44.functions.call('executeOrchestration', {
  orchestrationId: orchestration.id,
  initialInput: { query: 'Help with billing' }
});
```

---

## 5. Custom Functions API

### 5.1 Function Invocation

**Method**: `base44.functions.call(functionName, params?)`

**Parameters**:
- `functionName` (string): Name of serverless function
- `params` (object, optional): Function parameters

**Example**:
```javascript
// Execute workflow
const result = await base44.functions.call('executeWorkflow', {
  workflowId: 'workflow_123',
  inputs: { userId: 'user_456' }
});

// Generate analytics report
const report = await base44.functions.call('generateReport', {
  reportType: 'performance',
  dateRange: {
    start: '2026-01-01',
    end: '2026-01-31'
  }
});
```

### 5.2 Available Functions

#### executeWorkflow

**Description**: Execute a workflow with given inputs

**Parameters**:
```typescript
{
  workflowId: string;
  inputs: object;
  async?: boolean; // Default: false
}
```

**Response**:
```json
{
  "executionId": "exec_abc123",
  "status": "running",
  "startedAt": "2026-01-08T10:00:00Z"
}
```

#### cancelWorkflowExecution

**Description**: Cancel a running workflow execution

**Parameters**:
```typescript
{
  executionId: string;
}
```

**Response**:
```json
{
  "success": true,
  "executionId": "exec_abc123",
  "status": "cancelled"
}
```

#### testIntegration

**Description**: Test integration connectivity

**Parameters**:
```typescript
{
  integrationId: string;
}
```

**Response**:
```json
{
  "success": true,
  "message": "Connection successful",
  "latency": 245
}
```

#### executeOrchestration

**Description**: Execute multi-agent orchestration

**Parameters**:
```typescript
{
  orchestrationId: string;
  initialInput: object;
}
```

**Response**:
```json
{
  "orchestrationId": "orch_123",
  "status": "running",
  "currentAgent": "agent_1",
  "progress": 0.33
}
```

#### generateReport

**Description**: Generate analytics report

**Parameters**:
```typescript
{
  reportType: 'performance' | 'usage' | 'costs';
  dateRange: {
    start: string; // ISO 8601
    end: string;   // ISO 8601
  };
  filters?: object;
}
```

**Response**:
```json
{
  "reportId": "report_xyz",
  "type": "performance",
  "data": {
    "totalExecutions": 1250,
    "successRate": 0.97,
    "avgDuration": 2.5
  },
  "generatedAt": "2026-01-08T10:00:00Z"
}
```

---

## 6. Query Patterns & Best Practices

### 6.1 Filtering

**Simple Filter**:
```javascript
// Single condition
const result = await base44.data.list('Agent', {
  where: { status: 'active' }
});
```

**Multiple Conditions (AND)**:
```javascript
const result = await base44.data.list('Agent', {
  where: {
    status: 'active',
    userId: 'user_123'
  }
});
```

**IN Operator**:
```javascript
const result = await base44.data.list('Workflow', {
  where: {
    status: { in: ['active', 'draft'] }
  }
});
```

**Comparison Operators**:
```javascript
const result = await base44.data.list('WorkflowExecution', {
  where: {
    startedAt: { gte: '2026-01-01T00:00:00Z' },
    duration: { lt: 10000 } // Less than 10 seconds
  }
});
```

### 6.2 Sorting

```javascript
// Single field, descending
const result = await base44.data.list('Agent', {
  orderBy: { createdAt: 'desc' }
});

// Multiple fields
const result = await base44.data.list('Agent', {
  orderBy: [
    { status: 'asc' },
    { name: 'asc' }
  ]
});
```

### 6.3 Pagination

**Offset-based**:
```javascript
// First page
const page1 = await base44.data.list('Agent', {
  limit: 20,
  offset: 0
});

// Second page
const page2 = await base44.data.list('Agent', {
  limit: 20,
  offset: 20
});
```

**Cursor-based** (recommended for large datasets):
```javascript
// First page
const page1 = await base44.data.list('Agent', {
  limit: 20
});

// Next page using cursor
const page2 = await base44.data.list('Agent', {
  limit: 20,
  cursor: page1.nextCursor
});
```

### 6.4 Relationships

**Eager Loading**:
```javascript
// Load workflow with related data
const workflow = await base44.data.get('Workflow', workflowId, {
  include: {
    user: true,
    executions: {
      limit: 10,
      orderBy: { startedAt: 'desc' }
    }
  }
});
```

---

## 7. Error Handling

### 7.1 Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "name",
        "message": "Name is required"
      }
    ],
    "requestId": "req_abc123",
    "timestamp": "2026-01-08T10:00:00Z"
  }
}
```

### 7.2 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTHENTICATION_ERROR` | 401 | Invalid or missing authentication |
| `AUTHORIZATION_ERROR` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 422 | Input validation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

### 7.3 Error Handling Example

```javascript
try {
  const agent = await base44.data.create('Agent', agentData);
  console.log('Agent created:', agent.id);
} catch (error) {
  if (error.code === 'VALIDATION_ERROR') {
    console.error('Validation errors:', error.details);
    // Show validation errors to user
  } else if (error.code === 'AUTHORIZATION_ERROR') {
    console.error('Permission denied');
    // Redirect to login or show permission error
  } else {
    console.error('Unexpected error:', error.message);
    // Show generic error message
  }
}
```

---

## 8. Rate Limiting

### 8.1 Rate Limits by Tier

| Tier | Requests/Minute | Requests/Hour | Burst |
|------|----------------|---------------|-------|
| Free | 10 | 100 | 20 |
| Basic | 100 | 5,000 | 200 |
| Pro | 500 | 25,000 | 1,000 |
| Enterprise | Custom | Custom | Custom |

### 8.2 Rate Limit Headers

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704715200
```

### 8.3 Handling Rate Limits

```javascript
async function fetchWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.code === 'RATE_LIMIT_EXCEEDED') {
        const resetTime = error.resetAt || Date.now() + 60000;
        const waitTime = resetTime - Date.now();
        
        if (i < maxRetries - 1) {
          console.log(`Rate limited. Waiting ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }
      throw error;
    }
  }
}

// Usage
const agents = await fetchWithRetry(() => 
  base44.data.list('Agent')
);
```

---

## 9. Webhooks

### 9.1 Webhook Events

**Supported Events**:
- `agent.created`
- `agent.updated`
- `agent.deleted`
- `workflow.executed`
- `workflow.completed`
- `workflow.failed`
- `integration.connected`
- `integration.disconnected`

### 9.2 Webhook Payload

```json
{
  "event": "workflow.completed",
  "timestamp": "2026-01-08T10:00:00Z",
  "data": {
    "workflowId": "workflow_123",
    "executionId": "exec_abc",
    "status": "completed",
    "duration": 2500,
    "outputs": {
      "result": "success"
    }
  },
  "signature": "sha256=..."
}
```

### 9.3 Webhook Verification

```javascript
import crypto from 'crypto';

function verifyWebhookSignature(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return `sha256=${hash}` === signature;
}

// Usage in webhook handler
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const isValid = verifyWebhookSignature(req.body, signature, webhookSecret);
  
  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process webhook
  handleWebhookEvent(req.body);
  res.status(200).send('OK');
});
```

---

## 10. SDK Examples

### 10.1 React Hook Patterns

**Using TanStack Query**:
```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// Query hook
export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.data.list('Agent'),
  });
}

// Mutation hook
export function useCreateAgent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (agent) => base44.data.create('Agent', agent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

// Component usage
function AgentList() {
  const { data: agents, isLoading } = useAgents();
  const createAgent = useCreateAgent();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      {agents.map(agent => (
        <div key={agent.id}>{agent.name}</div>
      ))}
      <button onClick={() => createAgent.mutate({ name: 'New Agent' })}>
        Create Agent
      </button>
    </div>
  );
}
```

---

## 11. Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-08 | Initial API reference documentation | API Team |

---

## 12. Related Documents

- [SECURITY.md](./SECURITY.md) - API security and authentication
- [FRAMEWORK.md](./FRAMEWORK.md) - Base44 SDK implementation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [ENTITY_ACCESS_RULES.md](./ENTITY_ACCESS_RULES.md) - Permission model

---

**API Support**: api-support@orchestrator-ai.com  
**Status Page**: https://status.orchestrator-ai.com  
**Next Review**: April 8, 2026
