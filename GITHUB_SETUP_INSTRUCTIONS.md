# GitHub Setup Instructions
## AI Orchestrator Platform CI/CD Configuration

**Version:** 1.0  
**Last Updated:** January 8, 2026  
**Status:** Active  
**Owner:** DevOps Team

---

## 1. Executive Summary

This document provides step-by-step instructions for setting up the GitHub repository and configuring GitHub Actions for continuous integration and continuous deployment (CI/CD) of the AI Orchestrator Platform.

---

## 2. Prerequisites

### 2.1 Required Accounts

- GitHub account with repository access
- Base44 account (for backend deployment)
- Vercel/Netlify account (for frontend deployment) [optional]
- NPM account (for publishing packages) [optional]

### 2.2 Required Tools

- Git 2.30+
- Node.js 18+
- npm 9+
- GitHub CLI (gh) [optional]

---

## 3. Repository Setup

### 3.1 Create GitHub Repository

**Option 1: Using GitHub Web Interface**

1. Go to https://github.com/new
2. Enter repository name: `orchestrator-ai`
3. Choose visibility: Private or Public
4. Initialize with:
   - ✅ README file
   - ✅ .gitignore (Node template)
   - ⬜ License (add later if needed)
5. Click "Create repository"

**Option 2: Using GitHub CLI**

```bash
# Create repository
gh repo create Krosebrook/orchestrator-ai \
  --private \
  --description "AI Orchestrator Platform - Enterprise AI agent management" \
  --clone

# Navigate to repository
cd orchestrator-ai
```

### 3.2 Clone Repository

```bash
# HTTPS
git clone https://github.com/Krosebrook/orchestrator-ai.git

# SSH (recommended)
git clone git@github.com:Krosebrook/orchestrator-ai.git

cd orchestrator-ai
```

### 3.3 Initialize Project

```bash
# Install dependencies
npm install

# Verify setup
npm run dev
```

---

## 4. Branch Protection Rules

### 4.1 Configure Main Branch Protection

**Via GitHub Web Interface:**

1. Navigate to: Settings → Branches
2. Click "Add rule" or edit existing rule for `main`
3. Configure protection:

**Branch name pattern**: `main`

**Protection Rules**:
- ✅ Require a pull request before merging
  - ✅ Require approvals (1-2 reviewers)
  - ✅ Dismiss stale pull request approvals when new commits are pushed
  - ✅ Require review from Code Owners
- ✅ Require status checks to pass before merging
  - ✅ Require branches to be up to date before merging
  - Required status checks:
    - `build`
    - `test`
    - `lint`
- ✅ Require conversation resolution before merging
- ✅ Require signed commits [optional]
- ✅ Require linear history [optional]
- ✅ Include administrators
- ❌ Allow force pushes
- ❌ Allow deletions

4. Click "Create" or "Save changes"

### 4.2 Configure Development Branch (Optional)

Create a `develop` branch with similar but less strict rules:

```bash
# Create develop branch
git checkout -b develop
git push -u origin develop
```

**Protection Rules** (less strict than main):
- ✅ Require pull request (1 approval)
- ✅ Require status checks
- ⬜ Include administrators (allow admin override)

---

## 5. GitHub Secrets Configuration

### 5.1 Required Secrets

Navigate to: Settings → Secrets and variables → Actions → New repository secret

**Add the following secrets:**

```
BASE44_API_KEY          # Base44 API key for backend
BASE44_APP_ID           # Base44 application ID
VERCEL_TOKEN            # Vercel deployment token (if using Vercel)
SLACK_WEBHOOK_URL       # Slack notifications (optional)
SONAR_TOKEN             # SonarCloud code quality (optional)
CODECOV_TOKEN           # Code coverage reporting (optional)
NPM_TOKEN               # NPM publishing (if publishing packages)
```

**Steps to add each secret:**

1. Click "New repository secret"
2. Enter name (e.g., `BASE44_API_KEY`)
3. Enter value (the actual secret)
4. Click "Add secret"

### 5.2 Environment Variables

For non-sensitive configuration, use Variables:

Settings → Secrets and variables → Actions → Variables tab

```
NODE_ENV=production
VITE_APP_NAME=AI Orchestrator Platform
VITE_APP_VERSION=1.0.0
```

---

## 6. GitHub Actions Workflows

### 6.1 Create Workflow Directory

```bash
mkdir -p .github/workflows
```

### 6.2 CI Workflow (Build, Test, Lint)

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  build:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type check
        run: npm run typecheck
      
      - name: Run tests
        run: npm run test:run
      
      - name: Build
        run: npm run build
        env:
          VITE_BASE44_API_URL: ${{ secrets.BASE44_API_URL }}
          VITE_BASE44_API_KEY: ${{ secrets.BASE44_API_KEY }}
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v4
        if: matrix.node-version == '18.x'
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/coverage-final.json
          flags: unittests
          name: codecov-umbrella

  security-scan:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Run npm audit
        run: npm audit --audit-level=high
        continue-on-error: true
      
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        continue-on-error: true
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

### 6.3 CD Workflow (Deploy to Production)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_BASE44_API_URL: ${{ secrets.BASE44_API_URL_PROD }}
          VITE_BASE44_API_KEY: ${{ secrets.BASE44_API_KEY_PROD }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
      
      - name: Notify deployment
        uses: slackapi/slack-github-action@v1
        with:
          webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
          payload: |
            {
              "text": "✅ Deployment to production successful",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "Deployed version ${{ github.ref_name }} to production"
                  }
                }
              ]
            }
```

### 6.4 PR Preview Workflow

Create `.github/workflows/preview.yml`:

```yaml
name: Preview Deployment

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  preview:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_BASE44_API_URL: ${{ secrets.BASE44_API_URL_STAGING }}
          VITE_BASE44_API_KEY: ${{ secrets.BASE44_API_KEY_STAGING }}
      
      - name: Deploy to Vercel Preview
        uses: amondnet/vercel-action@v25
        id: vercel-preview
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
      
      - name: Comment PR with preview URL
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `🚀 Preview deployed: ${{ steps.vercel-preview.outputs.preview-url }}`
            })
```

### 6.5 Documentation Workflow

Create `.github/workflows/docs.yml`:

```yaml
name: Documentation

on:
  push:
    branches: [main]
    paths:
      - '**.md'
      - 'docs/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Validate Markdown
        uses: avto-dev/markdown-lint@v1
        with:
          config: '.markdownlint.json'
          args: '.'
      
      - name: Check links
        uses: gaurav-nelson/github-action-markdown-link-check@v1
        with:
          use-quiet-mode: 'yes'
          check-modified-files-only: 'yes'
```

---

## 7. GitHub Environments

### 7.1 Create Environments

**Via GitHub Web Interface:**

1. Navigate to: Settings → Environments
2. Click "New environment"
3. Create three environments:
   - `development`
   - `staging`
   - `production`

### 7.2 Configure Production Environment

For `production` environment:

**Protection Rules**:
- ✅ Required reviewers (2 reviewers)
- ✅ Wait timer (0 minutes or 5-10 for critical deployments)
- ⬜ Deployment branches: Only `main`

**Environment Secrets**:
```
BASE44_API_URL_PROD
BASE44_API_KEY_PROD
VERCEL_PROJECT_ID
```

### 7.3 Configure Staging Environment

For `staging` environment:

**Protection Rules**:
- ✅ Required reviewers (1 reviewer)
- ⬜ Deployment branches: `main` and `develop`

---

## 8. Code Quality Integration

### 8.1 SonarCloud Setup (Optional)

1. Go to https://sonarcloud.io
2. Sign in with GitHub
3. Import `orchestrator-ai` repository
4. Get project key and organization key
5. Add to GitHub secrets:
   - `SONAR_TOKEN`
   - `SONAR_PROJECT_KEY`
   - `SONAR_ORGANIZATION`

6. Add SonarCloud step to CI workflow:

```yaml
- name: SonarCloud Scan
  uses: SonarSource/sonarcloud-github-action@master
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

### 8.2 CodeCov Setup (Optional)

1. Go to https://codecov.io
2. Sign in with GitHub
3. Enable `orchestrator-ai` repository
4. Get upload token
5. Add to GitHub secrets: `CODECOV_TOKEN`

---

## 9. Dependabot Configuration

### 9.1 Enable Dependabot

Create `.github/dependabot.yml`:

```yaml
version: 2
updates:
  # npm dependencies
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 10
    reviewers:
      - "Krosebrook"
    labels:
      - "dependencies"
      - "automated"
    
  # GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "monthly"
    open-pull-requests-limit: 5
```

### 9.2 Configure Security Updates

1. Navigate to: Settings → Security → Code security and analysis
2. Enable:
   - ✅ Dependency graph
   - ✅ Dependabot alerts
   - ✅ Dependabot security updates
   - ✅ Secret scanning
   - ✅ Push protection (prevent committing secrets)

---

## 10. GitHub Issues & Project Management

### 10.1 Issue Templates

Create `.github/ISSUE_TEMPLATE/bug_report.md`:

```markdown
---
name: Bug Report
about: Create a report to help us improve
title: '[BUG] '
labels: bug
assignees: ''
---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g., Windows, macOS, Linux]
- Browser: [e.g., Chrome, Safari, Firefox]
- Version: [e.g., 1.0.0]

**Additional context**
Add any other context about the problem.
```

Create `.github/ISSUE_TEMPLATE/feature_request.md`:

```markdown
---
name: Feature Request
about: Suggest an idea for this project
title: '[FEATURE] '
labels: enhancement
assignees: ''
---

**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
What you want to happen.

**Describe alternatives you've considered**
Other solutions or features you've considered.

**Additional context**
Any other context or screenshots.
```

### 10.2 Pull Request Template

Create `.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Related Issues
Fixes #(issue number)
```

---

## 11. Webhook Configuration (Optional)

### 11.1 Slack Integration

1. Create Slack webhook: https://api.slack.com/messaging/webhooks
2. Add webhook URL to GitHub secrets: `SLACK_WEBHOOK_URL`
3. Use in workflows (see Deploy workflow example above)

### 11.2 Discord Integration

1. Create Discord webhook in server settings
2. Add to GitHub secrets: `DISCORD_WEBHOOK_URL`
3. Use `discord-webhook` action in workflows

---

## 12. Repository Settings

### 12.1 General Settings

Navigate to: Settings → General

**Features**:
- ✅ Issues
- ✅ Projects
- ✅ Wiki (optional)
- ✅ Discussions (optional)

**Pull Requests**:
- ✅ Allow squash merging
- ✅ Allow rebase merging
- ⬜ Allow merge commits (optional)
- ✅ Always suggest updating pull request branches
- ✅ Automatically delete head branches

### 12.2 Collaborators & Teams

Navigate to: Settings → Collaborators and teams

Add team members with appropriate roles:
- **Admin**: Full access
- **Maintain**: Manage repository without access to sensitive settings
- **Write**: Push to repository
- **Triage**: Manage issues and pull requests
- **Read**: View and clone repository

---

## 13. Local Development Setup

### 13.1 Configure Git Hooks

Install Husky for pre-commit hooks:

```bash
npm install --save-dev husky lint-staged
npx husky install
```

Create `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run lint-staged
```

Add to `package.json`:

```json
{
  "lint-staged": {
    "*.{js,jsx}": ["eslint --fix", "git add"],
    "*.{json,md}": ["prettier --write", "git add"]
  }
}
```

### 13.2 Environment Variables

Create `.env.example`:

```bash
# Base44 Configuration
VITE_BASE44_API_URL=https://api.base44.io
VITE_BASE44_API_KEY=your_api_key_here
VITE_BASE44_APP_ID=your_app_id_here

# Optional
VITE_ENVIRONMENT=development
```

Create `.env` (gitignored):

```bash
cp .env.example .env
# Edit .env with actual values
```

---

## 14. Verification Checklist

After completing setup, verify:

- [ ] Repository created and cloned
- [ ] Branch protection rules configured
- [ ] All secrets added
- [ ] CI workflow runs successfully on push
- [ ] PR creates preview deployment
- [ ] Tests pass in CI
- [ ] Linting passes in CI
- [ ] Build completes successfully
- [ ] Dependabot enabled
- [ ] Security scanning enabled
- [ ] Issue and PR templates working
- [ ] Local development environment working
- [ ] Git hooks running on commit

---

## 15. Troubleshooting

### 15.1 Common Issues

**Issue**: Workflow fails with "secret not found"  
**Solution**: Verify secret name matches exactly in workflow and GitHub settings

**Issue**: Build fails with module not found  
**Solution**: Check `package-lock.json` is committed, run `npm ci` instead of `npm install`

**Issue**: Tests fail in CI but pass locally  
**Solution**: Check for environment-specific issues, ensure CI uses same Node version

**Issue**: Deployment fails  
**Solution**: Check deployment secrets are correct, verify Base44/Vercel configuration

### 15.2 Getting Help

- GitHub Actions Documentation: https://docs.github.com/en/actions
- Base44 Documentation: https://docs.base44.io
- Repository Issues: https://github.com/Krosebrook/orchestrator-ai/issues

---

## 16. Related Documents

- [DOC_POLICY.md](./DOC_POLICY.md) - Documentation governance
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [SECURITY.md](./SECURITY.md) - Security practices
- [CHANGELOG_SEMANTIC.md](./CHANGELOG_SEMANTIC.md) - Release process

---

## 17. Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-08 | Initial GitHub setup instructions | DevOps Team |

---

**Support**: devops@orchestrator-ai.com  
**Next Review**: April 8, 2026
