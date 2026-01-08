import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Create a new QueryClient for testing
 * @returns {QueryClient}
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Custom render function that wraps components with necessary providers
 * @param {React.ReactElement} ui - Component to render
 * @param {Object} options - Render options
 * @param {QueryClient} options.queryClient - Optional QueryClient instance
 * @param {boolean} options.withRouter - Whether to wrap with BrowserRouter
 * @returns {Object} - Render result with additional utilities
 */
export function renderWithProviders(
  ui,
  {
    queryClient = createTestQueryClient(),
    withRouter = false,
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    const content = (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    if (withRouter) {
      return <BrowserRouter>{content}</BrowserRouter>;
    }

    return content;
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

/**
 * Mock alert data factory
 * @param {Object} overrides - Properties to override
 * @returns {Object} - Mock alert object
 */
export function createMockAlert(overrides = {}) {
  return {
    id: 'alert-1',
    title: 'Test Alert',
    severity: 'medium',
    type: 'anomaly',
    message: 'Test alert message',
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Mock agent data factory
 * @param {Object} overrides - Properties to override
 * @returns {Object} - Mock agent object
 */
export function createMockAgent(overrides = {}) {
  return {
    id: 'agent-1',
    name: 'Test Agent',
    status: 'active',
    version: '1.0.0',
    capabilities: ['task1', 'task2'],
    ...overrides,
  };
}

/**
 * Mock workflow data factory
 * @param {Object} overrides - Properties to override
 * @returns {Object} - Mock workflow object
 */
export function createMockWorkflow(overrides = {}) {
  return {
    id: 'workflow-1',
    name: 'Test Workflow',
    status: 'active',
    steps: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
