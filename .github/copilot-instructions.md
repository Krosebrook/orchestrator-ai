# GitHub Copilot Instructions for orchestrator-ai

> **AI Orchestrator Platform**: Enterprise application for managing, orchestrating, and optimizing AI agents and workflows at scale.

---

## 🎯 Project Overview

This is a comprehensive React-based web application built with modern technologies to provide AI agent management, workflow automation, and orchestration capabilities.

**Key Capabilities**:
- AI Agent Management & Versioning
- Visual Workflow Builder & Automation
- Multi-Agent Orchestration
- Third-party Integrations
- Real-time Monitoring & Analytics
- Team Collaboration & RBAC
- Agent Training & Knowledge Base

---

## 🏗️ Technology Stack

### Frontend
- **Framework**: React 18.2
- **Build Tool**: Vite 6.1
- **UI Library**: Radix UI + shadcn/ui
- **Styling**: Tailwind CSS 3.4
- **State Management**: TanStack Query 5.84 + React Context
- **Forms**: React Hook Form + Zod
- **Routing**: React Router 6.26

### Backend
- **SDK**: Base44 SDK 0.8.3 (serverless functions)

### Development
- **Linting**: ESLint 9.19
- **Type Checking**: TypeScript 5.8 (JSDoc mode)
- **Package Manager**: npm

---

## 📁 Project Structure

```
orchestrator-ai/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/          # Page-level components
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Utility functions
│   ├── lib/            # Library configurations
│   └── assets/         # Static assets
├── .github/            # GitHub configuration
├── PRD.md              # Product Requirements Document
├── ROADMAP.md          # Feature roadmap
├── TECHNICAL_AUDIT.md  # Technical assessment
├── RECOMMENDATIONS.md  # Implementation recommendations
└── package.json        # Dependencies and scripts
```

---

## 🔧 Development Workflow

### Getting Started
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Code Quality
```bash
# Run linter
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Type check
npm run typecheck
```

---

## 📋 Coding Conventions

### JavaScript/JSX
- Use **JavaScript** (not TypeScript) with JSDoc annotations for type safety
- Use **functional components** with hooks
- Follow **ESLint rules** configured in `eslint.config.js`
- Use **named exports** for components
- Keep components focused and single-purpose

### Component Structure
```javascript
/**
 * ComponentName - Brief description
 * @param {Object} props - Component props
 * @param {string} props.title - Title to display
 * @returns {JSX.Element}
 */
export function ComponentName({ title }) {
  // Component logic here
  return (
    <div className="tailwind-classes">
      {/* Component JSX */}
    </div>
  );
}
```

### Styling
- Use **Tailwind CSS** utility classes
- Follow existing design patterns from shadcn/ui components
- Use the custom theme defined in `tailwind.config.js`
- Prefer composition over creating new utility classes

### State Management
- Use **TanStack Query** for server state (API calls, caching)
- Use **React Context** for UI state that needs to be shared
- Use **local state** (useState) for component-specific state
- Use **useReducer** for complex local state logic

### Forms
- Use **React Hook Form** for form state management
- Use **Zod** for validation schemas
- Leverage **@hookform/resolvers** for integration

### API Calls
- Use **Base44 SDK** for backend function calls
- Wrap API calls with **TanStack Query** hooks
- Handle loading, error, and success states
- Implement proper error boundaries

---

## 🎨 UI Component Patterns

### Using Radix UI + shadcn/ui
- Check `src/components/ui/` for existing shadcn components
- Use Radix UI primitives for accessibility
- Follow the component patterns established in the codebase
- Ensure keyboard navigation and ARIA labels

### Creating New Components
1. Check if a similar component exists in `src/components/`
2. Use existing UI components as building blocks
3. Follow the established naming conventions
4. Add JSDoc comments
5. Ensure responsive design

---

## 🔒 Security Guidelines

### Input Validation
- Always validate user input with Zod schemas
- Sanitize data before rendering to prevent XSS
- Never trust client-side validation alone

### Authentication
- Use Base44 SDK authentication mechanisms
- Check user permissions server-side
- Store tokens securely

### Dependencies
- Avoid adding new dependencies without consideration
- Check for known vulnerabilities with `npm audit`
- Keep dependencies updated regularly

---

## ✅ Testing Strategy

### Current State
⚠️ **Note**: Testing infrastructure is not yet implemented. When adding tests:

### Recommendations for Future Testing
- **Unit Tests**: Vitest (recommended) or Jest
- **Component Tests**: React Testing Library
- **E2E Tests**: Playwright or Cypress
- Follow existing patterns once test infrastructure is established

---

## 📝 Documentation Standards

### Code Documentation
- Add JSDoc comments for all exported functions and components
- Explain **why**, not **what** (code should be self-explanatory)
- Document edge cases and gotchas
- Include usage examples for complex APIs

### Feature Documentation
- Update README.md for user-visible changes
- Update PRD.md if feature affects requirements
- Update ROADMAP.md if priorities change
- Create ADRs for significant architectural decisions

---

## 🚀 Feature Development Process

### For All Features
1. **Read** the Feature Template: `.github/COPILOT_FEATURE_TEMPLATE.md`
2. **Follow** the workflow outlined in the template
3. **Start** with Step 0: Context Scan
4. **Plan** before implementing (Step 1)
5. **Implement** with quality checks (Step 2)
6. **Document** your changes (Step 4)
7. **Test** thoroughly (Step 3)

### Small Changes (🔵)
- Bug fixes, typos, minor UI tweaks
- Build + Lint must pass
- Update docs if user-visible

### Medium Changes (🟢)
- New components, API endpoints, UI flows
- All Small requirements + edge cases + error handling
- Consider accessibility and loading states

### Large Changes (🔴)
- Architecture changes, new services, major refactors
- All Medium requirements + ADR + observability + performance
- Plan rollback strategy

---

## 🔍 Finding Reference Implementations

### Components
Look in `src/components/` for similar components:
- Form components: Check existing form patterns
- Layout components: See dashboard and page layouts
- UI components: Check `src/components/ui/` for shadcn components

### Hooks
Look in `src/hooks/` for:
- API integration patterns
- State management patterns
- Side effect handling

### Pages
Look in `src/pages/` for:
- Page structure and layout
- Navigation patterns
- Data fetching patterns

---

## 🐛 Troubleshooting

### Build Issues
- Clear `node_modules` and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Check for dependency conflicts in package.json
- Verify Node.js version compatibility

### Linting Errors
- Run `npm run lint:fix` to auto-fix issues
- Check ESLint configuration in `eslint.config.js`
- Some errors may require manual fixes

### Type Checking Errors
- Review JSDoc annotations
- Check `jsconfig.json` for type checking configuration
- Ensure proper type imports where needed

---

## 📚 Additional Resources

### Repository Documentation
- **PRD.md**: Complete product requirements and feature inventory
- **ROADMAP.md**: Phased development roadmap with priorities
- **TECHNICAL_AUDIT.md**: Codebase metrics, architecture, and assessment
- **RECOMMENDATIONS.md**: Implementation recommendations and best practices

### External Resources
- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev/guide)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Radix UI Docs](https://www.radix-ui.com/docs/primitives)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [React Hook Form Docs](https://react-hook-form.com)
- [Zod Documentation](https://zod.dev)

---

## 🤝 Contribution Guidelines

### Before Making Changes
1. Read relevant documentation (PRD, ROADMAP, etc.)
2. Understand the feature requirements
3. Check for similar existing implementations
4. Follow the Feature Template workflow

### During Development
1. Write clean, readable code
2. Follow existing patterns and conventions
3. Keep changes focused and minimal
4. Add appropriate documentation
5. Test your changes manually

### Before Submitting PR
1. Run `npm run build` - must succeed
2. Run `npm run lint` - must pass
3. Run `npm run typecheck` - must pass
4. Manually test all changes
5. Review your own code changes
6. Write comprehensive PR description

---

## ⚡ Quick Tips

### Performance
- Use `React.memo` for expensive components
- Use `useMemo` and `useCallback` appropriately
- Lazy load routes and heavy components
- Optimize images and assets

### Accessibility
- Use semantic HTML elements
- Add ARIA labels where needed
- Ensure keyboard navigation works
- Test with screen readers when possible

### Code Quality
- Keep functions small and focused
- Extract repeated logic into utilities
- Use meaningful variable and function names
- Avoid deep nesting

### Git Practices
- Write clear, descriptive commit messages
- Keep commits focused on single changes
- Reference issue numbers in commits
- Use conventional commit format when possible

---

**Last Updated**: 2025-12-30  
**Maintained By**: GitHub Copilot Agents  
**For Questions**: Refer to PRD.md, ROADMAP.md, or TECHNICAL_AUDIT.md
