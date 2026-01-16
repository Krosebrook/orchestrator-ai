# AI Orchestrator Platform

A comprehensive enterprise application for managing, orchestrating, and optimizing AI agents and workflows at scale.

**Version**: 1.1  
**Last Updated**: January 16, 2026  
**Status**: Active Development

## 📚 Documentation

This repository includes comprehensive documentation organized for both human developers and LLM consumption:

### Core Documentation Index for LLMs

- **[DOC_POLICY.md](./DOC_POLICY.md)** - Documentation governance, versioning, and approval process
- **[AGENTS_DOCUMENTATION_AUTHORITY.md](./AGENTS_DOCUMENTATION_AUTHORITY.md)** - AI-driven Documentation Authority system architecture
- **[SECURITY.md](./SECURITY.md)** - Comprehensive security architecture, data handling, and compliance measures
- **[FRAMEWORK.md](./FRAMEWORK.md)** - Core technologies, libraries, and architectural patterns (React, Tailwind, Base44)
- **[CHANGELOG_SEMANTIC.md](./CHANGELOG_SEMANTIC.md)** - Semantic versioning approach and release documentation
- **[API_REFERENCE.md](./API_REFERENCE.md)** - Complete API endpoint reference and interaction guide
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - High-level architectural overview of the entire system
- **[ENTITY_ACCESS_RULES.md](./ENTITY_ACCESS_RULES.md)** - Detailed RBAC rules for each database entity
- **[GITHUB_SETUP_INSTRUCTIONS.md](./GITHUB_SETUP_INSTRUCTIONS.md)** - Step-by-step GitHub repository and CI/CD setup
- **[PRD_MASTER.md](./PRD_MASTER.md)** - Overarching Product Requirements Document for the platform

### Additional Documentation

- **[PRD.md](./PRD.md)** - Complete Product Requirements Document with feature inventory
- **[ROADMAP.md](./ROADMAP.md)** - Feature roadmap with phases and timelines  
- **[TECHNICAL_AUDIT.md](./TECHNICAL_AUDIT.md)** - Detailed technical audit and assessment
- **[RECOMMENDATIONS.md](./RECOMMENDATIONS.md)** - Implementation recommendations, repository integrations, and GitHub agent prompts
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history following Keep a Changelog format
- **[agents.md](./agents.md)** - AI agent architecture, patterns, and decision logic
- **[claude.md](./claude.md)** - Claude agent configuration and usage
- **[gemini.md](./gemini.md)** - Gemini agent configuration and usage

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm (comes with Node.js)

### Installation

```bash
# Clone the repository
git clone https://github.com/Krosebrook/orchestrator-ai.git
cd orchestrator-ai

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Available Scripts

- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run typecheck` - Run TypeScript type checking
- `npm test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage report

## 🧪 Testing

The project uses **Vitest** as the test runner with **React Testing Library** for component testing.

### Running Tests

```bash
# Run tests in watch mode (for development)
npm test

# Run tests once (for CI)
npm run test:run

# Run tests with coverage report
npm run test:coverage

# Run tests with UI
npm run test:ui
```

### Test Structure

Tests are located in `__tests__` directories alongside the components they test:

```
src/
  components/
    ui/
      __tests__/
        button.test.jsx
        card.test.jsx
        input.test.jsx
        badge.test.jsx
      button.jsx
      card.jsx
      ...
```

### Writing Tests

Use the test utilities provided in `src/utils/test-utils.jsx`:

```javascript
import { renderWithProviders, userEvent } from '@/utils/test-utils';
import { Button } from '../button';

describe('Button', () => {
  it('should render correctly', () => {
    const { getByRole } = renderWithProviders(<Button>Click me</Button>);
    expect(getByRole('button')).toBeInTheDocument();
  });
});
```

### Coverage

Current coverage for tested components: **100%**

Tested components:
- Button (UI component)
- Card (UI component)
- Input (UI component)
- Badge (UI component)
- AlertsPanel (Business logic component)

Run `npm run test:coverage` to see detailed coverage reports.

## 🏗️ Architecture

Built with modern web technologies:

- **Framework**: React 18.2
- **Build Tool**: Vite 6.1
- **UI Library**: Radix UI + shadcn/ui
- **Styling**: Tailwind CSS 3.4
- **State Management**: TanStack Query 5.84
- **Backend SDK**: Base44 SDK 0.8.3
- **Forms**: React Hook Form + Zod

## ✨ Features

### Core Capabilities

- **Agent Management** - Manage AI agents, versions, and profiles
- **Workflow Automation** - Visual workflow builder with templates
- **Orchestration** - Multi-agent coordination and optimization
- **Integrations** - Connect to 3rd party APIs and services
- **Monitoring** - Real-time metrics and anomaly detection
- **Analytics** - Performance tracking and insights
- **Collaboration** - Team workspaces and shared workflows
- **Training** - Agent training modules and simulations
- **Knowledge Base** - Centralized knowledge management
- **RBAC** - Role-based access control and permissions

### Pages

- Landing & Getting Started
- Dashboard (10 persona-based views)
- Agents & Agent Administration
- Workflows
- Orchestration
- Integrations
- Deployments
- Performance Analytics
- Monitoring Dashboard
- Collaboration Hub
- Training Hub
- Knowledge Base
- User & Role Management

## 📊 Project Stats

- **Pages**: 16
- **Components**: 157
- **Lines of Code**: ~29,000
- **Entity Types**: 41
- **Test Coverage**: 100% (5 components tested, 137 tests)
- **Code Quality**: All linting checks passing

## 🗺️ Roadmap

See [ROADMAP.md](./ROADMAP.md) for the complete feature roadmap including:

*Phases are sequential, each lasting approximately 3 months:*

- **Phase 1**: Foundation & Stability
- **Phase 2**: Enhanced Intelligence
- **Phase 3**: Enterprise Readiness
- **Phase 4**: Advanced Capabilities
- **Phase 5**: AI-First Platform

## 🔍 Technical Audit

See [TECHNICAL_AUDIT.md](./TECHNICAL_AUDIT.md) for detailed technical analysis including:

- Codebase metrics and complexity
- Architecture assessment
- Code quality analysis
- Security evaluation
- Performance considerations
- Critical issues and recommendations

## 📄 License

[Add your license here]

## 🤝 Contributing

[Add contribution guidelines here]

## 📞 Support

[Add support information here]
