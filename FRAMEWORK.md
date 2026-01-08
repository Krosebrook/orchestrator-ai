# Technology Framework & Architecture Patterns
## AI Orchestrator Platform

**Version:** 1.0  
**Last Updated:** January 8, 2026  
**Status:** Active  
**Owner:** Engineering Team

---

## 1. Executive Summary

This document describes the core technologies, libraries, architectural patterns, and design decisions used in the AI Orchestrator Platform. It serves as the technical foundation reference for developers, architects, and AI agents working on the platform.

---

## 2. Technology Stack Overview

### 2.1 Stack Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    Technology Stack                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend:      React 18.2 + Vite 6.1 + Tailwind CSS 3.4   │
│  UI Library:    Radix UI + shadcn/ui                        │
│  State:         TanStack Query 5.84 + React Context         │
│  Forms:         React Hook Form + Zod                       │
│  Backend SDK:   Base44 SDK 0.8.3                            │
│  Type Safety:   TypeScript 5.8 (JSDoc mode)                 │
│  Testing:       Vitest 4.0 + React Testing Library          │
│  Build Tool:    Vite 6.1                                    │
│  Linting:       ESLint 9.19                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Version Matrix

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Core** | React | 18.2.0 | UI framework |
| | Vite | 6.1.0 | Build tool & dev server |
| | Node.js | 18+ | Runtime environment |
| **UI** | Radix UI | Various | Accessible UI primitives |
| | shadcn/ui | Latest | Pre-built components |
| | Tailwind CSS | 3.4.17 | Utility-first CSS |
| | Lucide React | 0.475.0 | Icon library |
| **State** | TanStack Query | 5.84.1 | Server state management |
| | React Router | 6.26.0 | Client-side routing |
| **Forms** | React Hook Form | 7.54.2 | Form management |
| | Zod | 3.24.2 | Schema validation |
| **Backend** | Base44 SDK | 0.8.3 | Serverless backend |
| **Dev Tools** | ESLint | 9.19.0 | Code linting |
| | TypeScript | 5.8.2 | Type checking (JSDoc) |
| | Vitest | 4.0.16 | Test runner |

---

## 3. Frontend Architecture

### 3.1 React 18.2

**Choice Rationale**:
- Industry-standard UI library
- Concurrent features for better UX
- Strong ecosystem and community
- Excellent developer experience

**Key Features Used**:
- Functional components with hooks
- Concurrent rendering
- Automatic batching
- Suspense for data fetching (planned)
- Server Components (future consideration)

**Code Patterns**:
```javascript
// Functional component with hooks
import { useState, useEffect } from 'react';

export function AgentCard({ agent }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  useEffect(() => {
    // Side effects here
  }, [agent.id]);
  
  return (
    <div onClick={() => setIsExpanded(!isExpanded)}>
      {/* Component JSX */}
    </div>
  );
}
```

### 3.2 Vite 6.1

**Choice Rationale**:
- Lightning-fast dev server with HMR
- Optimized production builds
- Native ES modules support
- Excellent plugin ecosystem

**Configuration**:
```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

**Build Optimization**:
- Code splitting for routes
- Lazy loading for heavy components
- Asset optimization (images, fonts)
- Tree shaking for smaller bundles

### 3.3 Project Structure

```
src/
├── components/          # Reusable components
│   ├── ui/             # shadcn/ui components
│   ├── agents/         # Agent-specific components
│   ├── workflows/      # Workflow components
│   ├── dashboards/     # Dashboard components
│   └── ...             # Other feature modules
├── pages/              # Page-level components
├── hooks/              # Custom React hooks
├── lib/                # Library configurations
├── utils/              # Utility functions
├── api/                # API client setup
├── App.jsx             # Root app component
├── Layout.jsx          # Layout wrapper
├── main.jsx            # Entry point
└── index.css           # Global styles
```

---

## 4. UI Framework & Styling

### 4.1 Radix UI + shadcn/ui

**Choice Rationale**:
- Unstyled, accessible primitives (Radix UI)
- Beautiful, customizable components (shadcn/ui)
- Full TypeScript support
- Excellent accessibility out of the box

**Component Architecture**:
```javascript
// Using Radix UI primitive
import * as Dialog from '@radix-ui/react-dialog';

// Wrapped in shadcn/ui styling
export function CustomDialog({ children, ...props }) {
  return (
    <Dialog.Root {...props}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 ...">
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

**Available Components** (48 UI primitives):
- Accordion, Alert Dialog, Avatar, Badge, Button
- Card, Checkbox, Collapsible, Combobox, Command
- Context Menu, Dialog, Dropdown Menu, Form, Hover Card
- Input, Label, Menubar, Navigation Menu, Popover
- Progress, Radio Group, Scroll Area, Select, Separator
- Sheet, Skeleton, Slider, Switch, Table
- Tabs, Textarea, Toast, Toggle, Tooltip

### 4.2 Tailwind CSS 3.4

**Choice Rationale**:
- Utility-first approach for rapid development
- Consistent design system
- Excellent performance (PurgeCSS)
- Responsive design built-in

**Configuration**:
```javascript
// tailwind.config.js
export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // ... more theme colors
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

**Styling Conventions**:
```javascript
// Component with Tailwind classes
export function Button({ variant = 'default', size = 'default', ...props }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md text-sm font-medium',
        'transition-colors focus-visible:outline-none focus-visible:ring-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        props.className
      )}
      {...props}
    />
  );
}
```

---

## 5. State Management

### 5.1 TanStack Query 5.84

**Choice Rationale**:
- Best-in-class server state management
- Automatic caching and invalidation
- Background refetching
- Optimistic updates
- Excellent DevTools

**Usage Patterns**:
```javascript
// Query hook for fetching data
import { useQuery } from '@tanstack/react-query';
import { base44Client } from '@/api/base44Client';

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: () => base44Client.data.list('Agent'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Mutation hook for creating data
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateAgent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (agent) => base44Client.data.create('Agent', agent),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

// Usage in component
function AgentList() {
  const { data: agents, isLoading, error } = useAgents();
  const createAgent = useCreateAgent();
  
  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  
  return (
    <div>
      {agents.map(agent => <AgentCard key={agent.id} agent={agent} />)}
      <button onClick={() => createAgent.mutate({ name: 'New Agent' })}>
        Create Agent
      </button>
    </div>
  );
}
```

**QueryClient Configuration**:
```javascript
// src/lib/queryClient.js
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    },
  },
});
```

### 5.2 React Context

**Use Cases**:
- Theme management (light/dark mode)
- Auth state
- UI state (sidebar, modals)
- Feature flags

**Pattern**:
```javascript
// src/contexts/AuthContext.jsx
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  
  const login = async (credentials) => {
    const user = await authenticateUser(credentials);
    setUser(user);
  };
  
  const logout = () => setUser(null);
  
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

### 5.3 Local State

**When to Use**:
- Component-specific state
- Form inputs
- Toggle states
- Temporary UI state

**Pattern**:
```javascript
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

---

## 6. Form Management

### 6.1 React Hook Form 7.54

**Choice Rationale**:
- Minimal re-renders
- Easy validation integration
- Great DX with TypeScript/JSDoc
- Small bundle size

**Basic Usage**:
```javascript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const agentSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  capabilities: z.array(z.string()).min(1, 'At least one capability required'),
});

export function AgentForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(agentSchema),
  });
  
  const onSubmit = (data) => {
    console.log('Valid data:', data);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
      
      <textarea {...register('description')} />
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

### 6.2 Zod Validation 3.24

**Choice Rationale**:
- TypeScript-first schema validation
- Composable validators
- Excellent error messages
- Works great with React Hook Form

**Advanced Schemas**:
```javascript
import { z } from 'zod';

// Reusable schemas
const emailSchema = z.string().email('Invalid email address');
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[0-9]/, 'Password must contain number');

// Composed schema
const userSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  age: z.number().int().min(18, 'Must be 18 or older'),
  terms: z.boolean().refine(val => val === true, 'Must accept terms'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords must match',
  path: ['confirmPassword'],
});

// Type inference
type User = z.infer<typeof userSchema>;
```

---

## 7. Backend Integration

### 7.1 Base44 SDK 0.8.3

**Choice Rationale**:
- Serverless backend as a service
- Built-in authentication and authorization
- Real-time data synchronization
- Managed database and APIs
- Easy deployment

**Client Setup**:
```javascript
// src/api/base44Client.js
import { Base44 } from '@base44/sdk';

export const base44Client = Base44({
  apiUrl: import.meta.env.VITE_BASE44_API_URL,
  apiKey: import.meta.env.VITE_BASE44_API_KEY,
});
```

**Data Operations**:
```javascript
// Create
const agent = await base44Client.data.create('Agent', {
  name: 'My Agent',
  status: 'active',
});

// Read (list with filters)
const agents = await base44Client.data.list('Agent', {
  where: { status: 'active' },
  orderBy: { createdAt: 'desc' },
  limit: 10,
});

// Read (single)
const agent = await base44Client.data.get('Agent', agentId);

// Update
const updated = await base44Client.data.update('Agent', agentId, {
  status: 'inactive',
});

// Delete
await base44Client.data.delete('Agent', agentId);
```

**Authentication**:
```javascript
// Login
const { user, token } = await base44Client.auth.login({
  email: 'user@example.com',
  password: 'password123',
});

// Get current user
const currentUser = await base44Client.auth.currentUser();

// Logout
await base44Client.auth.logout();
```

---

## 8. Type Safety

### 8.1 TypeScript with JSDoc

**Choice Rationale**:
- Type safety without TypeScript compilation
- Gradual typing adoption
- Better IDE support
- Documentation and types in one place

**JSDoc Patterns**:
```javascript
/**
 * Agent profile with capabilities and metadata
 * @typedef {Object} Agent
 * @property {string} id - Unique identifier
 * @property {string} name - Agent name
 * @property {string} [description] - Optional description
 * @property {Array<string>} capabilities - Agent capabilities
 * @property {'active'|'inactive'|'draft'} status - Agent status
 */

/**
 * Fetches agent by ID
 * @param {string} id - Agent ID
 * @returns {Promise<Agent>} Agent object
 * @throws {Error} If agent not found
 */
export async function getAgent(id) {
  return await base44Client.data.get('Agent', id);
}

/**
 * Component that displays agent card
 * @param {Object} props - Component props
 * @param {Agent} props.agent - Agent to display
 * @param {() => void} [props.onClick] - Optional click handler
 * @returns {JSX.Element}
 */
export function AgentCard({ agent, onClick }) {
  return <div onClick={onClick}>{agent.name}</div>;
}
```

**Type Checking**:
```json
// jsconfig.json
{
  "compilerOptions": {
    "checkJs": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitAny": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

---

## 9. Testing

### 9.1 Vitest 4.0

**Choice Rationale**:
- Vite-native test runner
- Fast execution with multi-threading
- Jest-compatible API
- Excellent UI for test debugging

**Configuration**:
```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/utils/test-setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/utils/test-*.js'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 9.2 React Testing Library

**Choice Rationale**:
- Test components like users interact with them
- Encourages accessible components
- Discourages implementation details testing
- Great community and documentation

**Testing Patterns**:
```javascript
// src/components/ui/__tests__/button.test.jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });
  
  it('handles click events', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('applies variant classes', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-destructive');
  });
});
```

**Test Utilities**:
```javascript
// src/utils/test-utils.jsx
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

function AllTheProviders({ children }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export function renderWithProviders(ui, options) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

export * from '@testing-library/react';
export { userEvent } from '@testing-library/user-event';
```

---

## 10. Code Quality

### 10.1 ESLint 9.19

**Configuration**:
```javascript
// eslint.config.js
import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import unusedImports from 'eslint-plugin-unused-imports';

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.2' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'unused-imports': unusedImports,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/jsx-no-target-blank': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'unused-imports/no-unused-imports': 'error',
    },
  },
];
```

**Scripts**:
```json
{
  "scripts": {
    "lint": "eslint . --quiet",
    "lint:fix": "eslint . --fix",
    "typecheck": "tsc -p ./jsconfig.json"
  }
}
```

---

## 11. Build & Deployment

### 11.1 Build Process

```bash
# Development
npm run dev              # Start dev server on localhost:3000

# Production build
npm run build            # Creates optimized build in dist/

# Preview production build
npm run preview          # Test production build locally
```

**Build Optimizations**:
- Code splitting by route
- Asset optimization
- CSS minification
- Tree shaking
- Source maps for debugging

### 11.2 Environment Configuration

```bash
# .env.development
VITE_BASE44_API_URL=https://dev-api.base44.io
VITE_BASE44_API_KEY=dev_key_123

# .env.production
VITE_BASE44_API_URL=https://api.base44.io
VITE_BASE44_API_KEY=prod_key_xyz
```

---

## 12. Performance Optimization

### 12.1 Code Splitting

```javascript
// Lazy loading routes
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Agents = lazy(() => import('./pages/Agents'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/agents" element={<Agents />} />
      </Routes>
    </Suspense>
  );
}
```

### 12.2 Memoization

```javascript
import { memo, useMemo, useCallback } from 'react';

// Memoize expensive computations
function Dashboard({ agents }) {
  const activeAgents = useMemo(
    () => agents.filter(a => a.status === 'active'),
    [agents]
  );
  
  const handleClick = useCallback(
    (id) => console.log('Clicked', id),
    []
  );
  
  return <AgentList agents={activeAgents} onClick={handleClick} />;
}

// Memoize components
export const AgentCard = memo(function AgentCard({ agent }) {
  return <div>{agent.name}</div>;
});
```

---

## 13. Accessibility

### 13.1 Standards

- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Color contrast ratios
- Focus management

### 13.2 Implementation

```javascript
// Semantic HTML
<nav role="navigation" aria-label="Main navigation">
  <ul>
    <li><a href="/">Home</a></li>
  </ul>
</nav>

// ARIA labels
<button aria-label="Delete agent" onClick={handleDelete}>
  <TrashIcon />
</button>

// Focus management
import { useEffect, useRef } from 'react';

function Modal({ isOpen }) {
  const firstFocusableElement = useRef(null);
  
  useEffect(() => {
    if (isOpen) {
      firstFocusableElement.current?.focus();
    }
  }, [isOpen]);
  
  return (
    <dialog open={isOpen}>
      <button ref={firstFocusableElement}>Close</button>
    </dialog>
  );
}
```

---

## 14. Future Considerations

### 14.1 Roadmap Enhancements

**Q2 2026**:
- Server-Side Rendering (SSR) with React Server Components
- Progressive Web App (PWA) capabilities
- GraphQL API integration

**Q3 2026**:
- Mobile app (React Native code sharing)
- Micro-frontend architecture
- Advanced caching strategies

**Q4 2026**:
- Edge computing with CloudFlare Workers
- Real-time collaboration features
- AI-powered code generation

---

## 15. Related Documents

- [ARCHITECTURE.md](./ARCHITECTURE.md) - High-level system architecture
- [API_REFERENCE.md](./API_REFERENCE.md) - API documentation
- [SECURITY.md](./SECURITY.md) - Security practices
- [DOC_POLICY.md](./DOC_POLICY.md) - Documentation standards
- [README.md](./README.md) - Quick start guide

---

## 16. Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-08 | Initial framework documentation | Engineering Team |

---

**Review Cycle**: Quarterly  
**Next Review**: April 8, 2026
