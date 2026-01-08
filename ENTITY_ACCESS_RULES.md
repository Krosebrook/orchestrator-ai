# Entity Access Rules (RBAC)
## AI Orchestrator Platform

**Version:** 1.0  
**Last Updated:** January 8, 2026  
**Status:** Active  
**Owner:** Security & Architecture Team

---

## 1. Executive Summary

This document provides a detailed explanation of role-based access control (RBAC) rules for each database entity in the AI Orchestrator Platform. It defines permissions, access patterns, and security policies that govern how users interact with system resources based on their assigned roles.

---

## 2. RBAC Overview

### 2.1 Core Principles

1. **Least Privilege**: Users have minimum necessary permissions
2. **Role-Based**: Permissions assigned to roles, not individual users
3. **Hierarchical**: Higher roles inherit lower role permissions
4. **Context-Aware**: Permissions vary by resource ownership and organization
5. **Auditable**: All access attempts logged

### 2.2 Role Hierarchy

```
┌──────────────────────────────────────────────────────────┐
│                    System Administrator                   │
│  - All permissions across entire platform                │
│  - User management, system configuration                 │
└────────────────────────┬─────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
┌─────────▼────────────┐    ┌──────────▼─────────────┐
│ Organization Admin   │    │   Security Admin       │
│ - Org-level access   │    │ - Security policies    │
│ - Manage org users   │    │ - Audit logs           │
└─────────┬────────────┘    └────────────────────────┘
          │
          │
┌─────────▼────────────┐
│   Team Manager       │
│ - Team resources     │
│ - Approve workflows  │
└─────────┬────────────┘
          │
          │
┌─────────▼────────────┐
│    Developer         │
│ - CRUD resources     │
│ - Execute workflows  │
└─────────┬────────────┘
          │
          │
┌─────────▼────────────┐
│     Analyst          │
│ - Read metrics       │
│ - Generate reports   │
└──────────────────────┘
          │
┌─────────▼────────────┐
│      Viewer          │
│ - Read-only access   │
└──────────────────────┘
```

---

## 3. Standard Roles & Permissions

### 3.1 System Administrator

**Scope**: Platform-wide

**Permissions**:
- `*:*` - All permissions on all resources
- User management (create, read, update, delete, assign roles)
- System configuration
- Billing and subscription management
- Security policy configuration
- Audit log access

**Restrictions**:
- Requires MFA (Multi-Factor Authentication)
- All actions logged
- Cannot be assigned to regular users

### 3.2 Organization Administrator

**Scope**: Organization-level

**Permissions**:
- `user:create`, `user:read`, `user:update`, `user:delete` (within org)
- `role:assign` (within org)
- `team:*` (manage teams)
- `agent:*` (all agents in org)
- `workflow:*` (all workflows in org)
- `integration:*` (all integrations in org)
- `orchestration:*` (all orchestrations in org)
- `billing:read` (view billing)
- `analytics:read` (org-wide analytics)

**Restrictions**:
- Cannot access other organizations
- Cannot change system settings
- Cannot access system audit logs

### 3.3 Team Manager

**Scope**: Team-level

**Permissions**:
- `team:read`, `team:update` (own team)
- `user:read` (team members)
- `agent:create`, `agent:read`, `agent:update`, `agent:delete` (team agents)
- `workflow:create`, `workflow:read`, `workflow:update`, `workflow:delete` (team workflows)
- `workflow:approve` (approve team workflows)
- `orchestration:read`, `orchestration:create` (team orchestrations)
- `integration:read` (view integrations)
- `analytics:read` (team analytics)

**Restrictions**:
- Cannot manage users outside team
- Cannot access other team's resources
- Cannot configure org-level settings

### 3.4 Developer

**Scope**: User-level (own resources) + Team-level (shared resources)

**Permissions**:
- `agent:create`, `agent:read`, `agent:update`, `agent:delete` (own agents)
- `agent:read` (team agents)
- `workflow:create`, `workflow:read`, `workflow:update`, `workflow:delete` (own workflows)
- `workflow:read`, `workflow:execute` (team workflows)
- `orchestration:read`, `orchestration:execute` (team orchestrations)
- `integration:read`, `integration:create` (create integrations)
- `training:read`, `training:complete` (training modules)
- `knowledge:read`, `knowledge:create` (knowledge articles)
- `deployment:read` (view deployments)

**Restrictions**:
- Cannot delete team resources
- Cannot approve workflows
- Cannot manage users or teams
- Cannot access billing

### 3.5 Analyst

**Scope**: Read-only analytics and reporting

**Permissions**:
- `analytics:read` (all analytics)
- `report:generate` (generate reports)
- `agent:read` (view agents)
- `workflow:read` (view workflows)
- `metric:read` (view metrics)
- `dashboard:read` (view dashboards)
- `knowledge:read` (view knowledge base)

**Restrictions**:
- Cannot create, update, or delete resources
- Cannot execute workflows or agents
- No access to user management
- No access to system configuration

### 3.6 Viewer

**Scope**: Read-only access to resources

**Permissions**:
- `agent:read` (view agents)
- `workflow:read` (view workflows)
- `orchestration:read` (view orchestrations)
- `integration:read` (view integrations)
- `knowledge:read` (view knowledge base)
- `dashboard:read` (view dashboards)

**Restrictions**:
- Cannot create, update, or delete any resources
- Cannot execute workflows
- No access to analytics
- No access to user management

---

## 4. Entity-Level Access Rules

### 4.1 Agent Entity

**Entity**: `Agent`

**Fields**:
- `id`, `name`, `description`, `status`, `capabilities`, `configuration`
- `userId` (owner), `organizationId`, `teamId`
- `createdAt`, `updatedAt`

**Access Rules**:

| Role | Create | Read | Update | Delete | Execute |
|------|--------|------|--------|--------|---------|
| **System Admin** | ✅ | ✅ All | ✅ All | ✅ All | ✅ All |
| **Org Admin** | ✅ | ✅ Org | ✅ Org | ✅ Org | ✅ Org |
| **Team Manager** | ✅ | ✅ Team | ✅ Team | ✅ Team | ✅ Team |
| **Developer** | ✅ | ✅ Own + Team | ✅ Own | ✅ Own | ✅ Own + Team |
| **Analyst** | ❌ | ✅ Org | ❌ | ❌ | ❌ |
| **Viewer** | ❌ | ✅ Team | ❌ | ❌ | ❌ |

**Ownership Rules**:
- User can always access their own agents
- Team members can read team agents
- Managers can modify team agents

**Special Permissions**:
- `agent:publish` - Publish agent to marketplace (Org Admin only)
- `agent:share` - Share agent with other teams (Team Manager, Developer)
- `agent:clone` - Clone existing agent (Developer, Team Manager)

**Code Example**:
```javascript
// Check if user can update agent
async function canUpdateAgent(userId, agentId) {
  const agent = await base44.data.get('Agent', agentId);
  const user = await base44.data.get('User', userId);
  
  // Owner can always update
  if (agent.userId === userId) return true;
  
  // Team manager can update team agents
  if (user.role === 'team_manager' && agent.teamId === user.teamId) {
    return true;
  }
  
  // Org admin can update org agents
  if (user.role === 'org_admin' && agent.organizationId === user.organizationId) {
    return true;
  }
  
  // System admin can update all
  if (user.role === 'system_admin') return true;
  
  return false;
}
```

### 4.2 Workflow Entity

**Entity**: `Workflow`

**Fields**:
- `id`, `name`, `description`, `status`, `nodes`, `edges`, `triggers`
- `userId` (owner), `organizationId`, `teamId`
- `approvedBy`, `approvedAt`
- `createdAt`, `updatedAt`

**Access Rules**:

| Role | Create | Read | Update | Delete | Execute | Approve |
|------|--------|------|--------|--------|---------|---------|
| **System Admin** | ✅ | ✅ All | ✅ All | ✅ All | ✅ All | ✅ All |
| **Org Admin** | ✅ | ✅ Org | ✅ Org | ✅ Org | ✅ Org | ✅ Org |
| **Team Manager** | ✅ | ✅ Team | ✅ Team | ✅ Team | ✅ Team | ✅ Team |
| **Developer** | ✅ | ✅ Own + Team | ✅ Own | ✅ Own | ✅ Own + Approved | ❌ |
| **Analyst** | ❌ | ✅ Org | ❌ | ❌ | ❌ | ❌ |
| **Viewer** | ❌ | ✅ Team | ❌ | ❌ | ❌ | ❌ |

**Approval Workflow**:
- Draft workflows can only be executed by owner
- Workflows must be approved by Team Manager or higher before team execution
- Changes to approved workflows require re-approval

**Special Permissions**:
- `workflow:schedule` - Schedule automated execution (Developer, Team Manager)
- `workflow:pause` - Pause scheduled workflow (Owner, Team Manager)
- `workflow:export` - Export workflow definition (Developer, Analyst)
- `workflow:import` - Import workflow (Developer, Team Manager)

### 4.3 WorkflowExecution Entity

**Entity**: `WorkflowExecution`

**Fields**:
- `id`, `workflowId`, `status`, `startedAt`, `completedAt`
- `inputs`, `outputs`, `logs`, `error`
- `userId` (initiator)

**Access Rules**:

| Role | Create | Read | Cancel |
|------|--------|------|--------|
| **System Admin** | ✅ | ✅ All | ✅ All |
| **Org Admin** | ✅ | ✅ Org | ✅ Org |
| **Team Manager** | ✅ | ✅ Team | ✅ Team |
| **Developer** | ✅ | ✅ Own + Team | ✅ Own |
| **Analyst** | ❌ | ✅ Org | ❌ |
| **Viewer** | ❌ | ✅ Team | ❌ |

**Log Access**:
- Execution logs inherit workflow permissions
- Error logs accessible to Debug role
- Sensitive data in logs masked for Viewer role

### 4.4 Integration Entity

**Entity**: `Integration`

**Fields**:
- `id`, `name`, `type`, `provider`, `status`
- `configuration` (contains sensitive credentials)
- `userId`, `organizationId`, `teamId`

**Access Rules**:

| Role | Create | Read | Update | Delete | Test |
|------|--------|------|--------|--------|------|
| **System Admin** | ✅ | ✅ All | ✅ All | ✅ All | ✅ All |
| **Org Admin** | ✅ | ✅ Org | ✅ Org | ✅ Org | ✅ Org |
| **Team Manager** | ✅ | ✅ Team | ✅ Team | ✅ Team | ✅ Team |
| **Developer** | ✅ | ✅ Team | ✅ Own | ✅ Own | ✅ Own |
| **Analyst** | ❌ | ✅ Metadata | ❌ | ❌ | ❌ |
| **Viewer** | ❌ | ✅ Metadata | ❌ | ❌ | ❌ |

**Security Rules**:
- `configuration.credentials` field encrypted at rest
- API keys never returned in read operations (masked)
- Only owner and admins can view full credentials
- Test operation limited to prevent abuse (rate limiting)

**Field-Level Security**:
```javascript
// Mask sensitive fields based on role
function maskIntegrationData(integration, userRole) {
  if (['system_admin', 'org_admin'].includes(userRole)) {
    return integration; // Full access
  }
  
  if (userRole === 'team_manager' || userRole === 'developer') {
    return {
      ...integration,
      configuration: {
        ...integration.configuration,
        apiKey: '***masked***',
        credentials: '***masked***'
      }
    };
  }
  
  // Analyst and Viewer get metadata only
  return {
    id: integration.id,
    name: integration.name,
    type: integration.type,
    provider: integration.provider,
    status: integration.status
  };
}
```

### 4.5 AgentOrchestration Entity

**Entity**: `AgentOrchestration`

**Fields**:
- `id`, `name`, `description`, `agents`, `strategy`, `configuration`
- `userId`, `organizationId`, `teamId`
- `status`

**Access Rules**:

| Role | Create | Read | Update | Delete | Execute |
|------|--------|------|--------|--------|---------|
| **System Admin** | ✅ | ✅ All | ✅ All | ✅ All | ✅ All |
| **Org Admin** | ✅ | ✅ Org | ✅ Org | ✅ Org | ✅ Org |
| **Team Manager** | ✅ | ✅ Team | ✅ Team | ✅ Team | ✅ Team |
| **Developer** | ✅ | ✅ Own + Team | ✅ Own | ✅ Own | ✅ Own + Team |
| **Analyst** | ❌ | ✅ Org | ❌ | ❌ | ❌ |
| **Viewer** | ❌ | ✅ Team | ❌ | ❌ | ❌ |

**Dependency Rules**:
- User must have `agent:read` permission on all agents in orchestration
- User must have `agent:execute` permission to execute orchestration

### 4.6 Performance Metrics Entity

**Entity**: `AgentPerformanceMetric`

**Fields**:
- `id`, `agentId`, `metricType`, `value`, `timestamp`
- `organizationId`, `teamId`

**Access Rules**:

| Role | Create | Read | Delete |
|------|--------|------|--------|
| **System Admin** | ✅ | ✅ All | ✅ All |
| **Org Admin** | ❌ | ✅ Org | ✅ Org |
| **Team Manager** | ❌ | ✅ Team | ❌ |
| **Developer** | ❌ | ✅ Team | ❌ |
| **Analyst** | ❌ | ✅ Org | ❌ |
| **Viewer** | ❌ | ✅ Team | ❌ |

**Notes**:
- Metrics auto-generated by system
- Users cannot manually create metrics
- Deletion restricted to prevent data tampering

### 4.7 Knowledge Base Entity

**Entity**: `KnowledgeArticle`

**Fields**:
- `id`, `title`, `content`, `tags`, `category`
- `userId` (author), `organizationId`
- `published`, `publishedAt`

**Access Rules**:

| Role | Create | Read | Update | Delete | Publish |
|------|--------|------|--------|--------|---------|
| **System Admin** | ✅ | ✅ All | ✅ All | ✅ All | ✅ All |
| **Org Admin** | ✅ | ✅ Org | ✅ Org | ✅ Org | ✅ Org |
| **Team Manager** | ✅ | ✅ Org | ✅ Own | ✅ Own | ✅ Team |
| **Developer** | ✅ | ✅ Published | ✅ Own | ✅ Own | ❌ |
| **Analyst** | ✅ | ✅ Published | ✅ Own | ✅ Own | ❌ |
| **Viewer** | ❌ | ✅ Published | ❌ | ❌ | ❌ |

**Publishing Rules**:
- Draft articles visible only to author and admins
- Published articles visible to all org members
- Team Manager approval required for publication (optional setting)

### 4.8 Training Module Entity

**Entity**: `TrainingModule`

**Fields**:
- `id`, `title`, `content`, `type`, `difficulty`
- `organizationId`, `targetRoles`
- `required`, `completionRate`

**Access Rules**:

| Role | Create | Read | Update | Delete | Complete |
|------|--------|------|--------|--------|----------|
| **System Admin** | ✅ | ✅ All | ✅ All | ✅ All | ✅ |
| **Org Admin** | ✅ | ✅ Org | ✅ Org | ✅ Org | ✅ |
| **Team Manager** | ✅ | ✅ Assigned | ✅ Own | ✅ Own | ✅ |
| **Developer** | ❌ | ✅ Assigned | ❌ | ❌ | ✅ |
| **Analyst** | ❌ | ✅ Assigned | ❌ | ❌ | ✅ |
| **Viewer** | ❌ | ✅ Assigned | ❌ | ❌ | ✅ |

**Assignment Rules**:
- Modules assigned based on `targetRoles` field
- Required modules must be completed before certain actions
- Completion tracked per user

### 4.9 User & Organization Entities

**Entity**: `User`

**Fields**:
- `id`, `email`, `name`, `role`, `organizationId`, `teamId`
- `status`, `lastLoginAt`

**Access Rules**:

| Role | Create | Read | Update | Delete | Assign Role |
|------|--------|------|--------|--------|-------------|
| **System Admin** | ✅ | ✅ All | ✅ All | ✅ All | ✅ All |
| **Org Admin** | ✅ | ✅ Org | ✅ Org | ✅ Org | ✅ Org |
| **Team Manager** | ❌ | ✅ Team | ❌ | ❌ | ❌ |
| **Developer** | ❌ | ✅ Own + Team | ✅ Own | ❌ | ❌ |
| **Analyst** | ❌ | ✅ Own | ✅ Own | ❌ | ❌ |
| **Viewer** | ❌ | ✅ Own | ✅ Own | ❌ | ❌ |

**Self-Service Rules**:
- Users can always view/update their own profile
- Users cannot change their own role
- Users cannot delete their own account (must request)

**Entity**: `Organization`

**Access Rules**:

| Role | Create | Read | Update | Delete |
|------|--------|------|--------|--------|
| **System Admin** | ✅ | ✅ All | ✅ All | ✅ All |
| **Org Admin** | ❌ | ✅ Own | ✅ Own | ❌ |
| **Others** | ❌ | ✅ Own | ❌ | ❌ |

---

## 5. Resource Ownership & Sharing

### 5.1 Ownership Model

**Owner**: User who created the resource  
**Team**: Team to which resource belongs  
**Organization**: Organization owning the resource

```javascript
// Resource ownership structure
{
  id: 'resource_123',
  userId: 'user_456',        // Owner
  teamId: 'team_789',        // Team ownership
  organizationId: 'org_012', // Org ownership
  visibility: 'team',        // 'private', 'team', 'organization'
  sharedWith: ['user_999']   // Additional users with access
}
```

### 5.2 Visibility Levels

**Private**: Only owner and admins can access  
**Team**: Team members can read, owner can modify  
**Organization**: All org members can read, team can modify

### 5.3 Sharing Rules

```javascript
// Share resource with another user
async function shareResource(resourceId, targetUserId, permission) {
  const resource = await base44.data.get('Agent', resourceId);
  const user = await getCurrentUser();
  
  // Only owner or admins can share
  if (resource.userId !== user.id && !isAdmin(user)) {
    throw new Error('Permission denied');
  }
  
  // Add to sharedWith list
  await base44.data.update('Agent', resourceId, {
    sharedWith: [...resource.sharedWith, {
      userId: targetUserId,
      permission: permission, // 'read' or 'execute'
      grantedAt: new Date(),
      grantedBy: user.id
    }]
  });
}
```

---

## 6. Audit & Compliance

### 6.1 Audit Logging

**Logged Events**:
- All create, update, delete operations
- Permission changes
- Failed authorization attempts
- Sensitive data access (integrations, credentials)
- Workflow executions
- Agent executions

**Audit Log Entry**:
```json
{
  "timestamp": "2026-01-08T10:00:00Z",
  "userId": "user_123",
  "action": "agent.update",
  "resourceId": "agent_456",
  "resourceType": "Agent",
  "result": "success",
  "ipAddress": "192.168.1.1",
  "changes": {
    "before": { "status": "draft" },
    "after": { "status": "active" }
  }
}
```

### 6.2 Access Reviews

**Quarterly Review**:
- Review user roles and permissions
- Identify unused accounts
- Verify least privilege principle
- Update access based on job changes

**Automated Alerts**:
- Multiple failed authorization attempts
- Privilege escalation attempts
- Access to sensitive data
- Unusual access patterns

---

## 7. Implementation Guide

### 7.1 Permission Check Middleware

```javascript
// Express middleware for permission checking
function requirePermission(permission) {
  return async (req, res, next) => {
    const user = req.user;
    const resourceId = req.params.id;
    
    // System admin always allowed
    if (user.role === 'system_admin') {
      return next();
    }
    
    // Check specific permission
    const hasPermission = await checkPermission(
      user,
      permission,
      resourceId
    );
    
    if (!hasPermission) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: permission
      });
    }
    
    next();
  };
}

// Usage
app.put('/api/agents/:id', 
  requirePermission('agent:update'),
  updateAgent
);
```

### 7.2 Permission Check Function

```javascript
async function checkPermission(user, permission, resourceId) {
  const [resource, action] = permission.split(':');
  
  // Get resource if ID provided
  let resourceData = null;
  if (resourceId) {
    resourceData = await base44.data.get(resource, resourceId);
  }
  
  // Check based on role and ownership
  switch (user.role) {
    case 'system_admin':
      return true;
      
    case 'org_admin':
      return !resourceData || 
             resourceData.organizationId === user.organizationId;
      
    case 'team_manager':
      if (action === 'create' || action === 'read') return true;
      return resourceData && 
             resourceData.teamId === user.teamId;
      
    case 'developer':
      if (action === 'create') return true;
      if (action === 'read') {
        return !resourceData ||
               resourceData.userId === user.id ||
               resourceData.teamId === user.teamId;
      }
      return resourceData && resourceData.userId === user.id;
      
    case 'analyst':
      return action === 'read';
      
    case 'viewer':
      return action === 'read' && 
             (!resourceData || resourceData.teamId === user.teamId);
      
    default:
      return false;
  }
}
```

---

## 8. Related Documents

- [SECURITY.md](./SECURITY.md) - Overall security architecture
- [API_REFERENCE.md](./API_REFERENCE.md) - API authentication and authorization
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [DOC_POLICY.md](./DOC_POLICY.md) - Documentation access control

---

## 9. Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-08 | Initial RBAC documentation | Security Team |

---

**Review Cycle**: Quarterly  
**Next Review**: April 8, 2026
