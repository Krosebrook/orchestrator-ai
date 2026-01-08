# Semantic Versioning & Changelog
## AI Orchestrator Platform

**Version:** 1.0  
**Last Updated:** January 8, 2026  
**Status:** Active  
**Owner:** Release Management Team

---

## 1. Executive Summary

This document explains the semantic versioning approach used for releases of the AI Orchestrator Platform and how changes are documented in the changelog. It provides guidance for developers, release managers, and automated systems on versioning, release processes, and changelog maintenance.

---

## 2. Semantic Versioning (SemVer)

### 2.1 Version Format

We follow [Semantic Versioning 2.0.0](https://semver.org/) with the format:

```
MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]

Examples:
  1.0.0           - Initial release
  1.2.3           - Standard release
  2.0.0-alpha.1   - Pre-release
  1.0.0+20230615  - Build metadata
```

### 2.2 Version Components

#### MAJOR Version (X.0.0)

**Increment When**:
- Breaking changes to public APIs
- Removal of deprecated features
- Fundamental architecture changes
- Changes requiring user action (migration scripts, config updates)

**Examples**:
```
1.0.0 → 2.0.0
- Removed deprecated workflow API v1
- Changed authentication from OAuth 1.0 to OAuth 2.0
- Restructured agent capability system (requires data migration)
```

#### MINOR Version (0.X.0)

**Increment When**:
- New features added (backwards compatible)
- Deprecation of existing features (not removal)
- Significant internal improvements
- New API endpoints or methods

**Examples**:
```
1.2.0 → 1.3.0
- Added multi-agent orchestration dashboard
- Introduced workflow templates feature
- Deprecated old agent profile API (still functional)
- Added REST API endpoints for analytics
```

#### PATCH Version (0.0.X)

**Increment When**:
- Bug fixes (backwards compatible)
- Security patches
- Performance improvements
- Documentation updates
- Minor UI/UX adjustments

**Examples**:
```
1.2.3 → 1.2.4
- Fixed workflow execution timeout bug
- Patched XSS vulnerability in agent description field
- Improved dashboard loading performance
- Updated API documentation
```

### 2.3 Pre-release Versions

**Format**: `MAJOR.MINOR.PATCH-PRERELEASE`

**Pre-release Identifiers**:
- `alpha` - Early testing, unstable, may have bugs
- `beta` - Feature complete, testing for bugs
- `rc` (Release Candidate) - Final testing before release

**Examples**:
```
2.0.0-alpha.1     - First alpha of version 2.0.0
2.0.0-alpha.2     - Second alpha (fixes from alpha.1)
2.0.0-beta.1      - First beta (all features complete)
2.0.0-rc.1        - First release candidate
2.0.0             - Stable release
```

**Alpha → Beta → RC → Stable Progression**:
```
Development → 2.0.0-alpha.1 → ... → 2.0.0-alpha.n
            → 2.0.0-beta.1 → ... → 2.0.0-beta.n
            → 2.0.0-rc.1 → ... → 2.0.0-rc.n
            → 2.0.0 (stable)
```

### 2.4 Build Metadata

**Format**: `MAJOR.MINOR.PATCH+BUILD`

**Use Cases**:
- CI/CD build numbers
- Commit hashes
- Build dates

**Examples**:
```
1.2.3+20260108         - Build on Jan 8, 2026
1.2.3+build.123        - CI build number 123
1.2.3+sha.5114f85      - Built from commit SHA
```

---

## 3. Version Precedence

**Ordering Rules** (from lowest to highest):

```
1.0.0-alpha.1
  < 1.0.0-alpha.2
  < 1.0.0-beta.1
  < 1.0.0-rc.1
  < 1.0.0
  < 1.0.1
  < 1.1.0
  < 2.0.0
```

**Key Points**:
- Pre-release versions have lower precedence than normal versions
- Build metadata does NOT affect version precedence
- `1.0.0` and `1.0.0+build123` are considered equal in precedence

---

## 4. Changelog Standards

### 4.1 Format

We follow [Keep a Changelog 1.1.0](https://keepachangelog.com/):

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New feature descriptions

### Changed
- Changes to existing functionality

### Deprecated
- Features that will be removed in future versions

### Removed
- Features removed in this release

### Fixed
- Bug fixes

### Security
- Security vulnerability patches

## [1.2.0] - 2026-01-15

### Added
- Multi-agent orchestration dashboard
- Workflow template library with 20+ templates

### Fixed
- Workflow execution timeout bug (#123)
- Dashboard loading performance issue (#145)
```

### 4.2 Change Categories

| Category | Description | Example |
|----------|-------------|---------|
| **Added** | New features | "Added workflow version control" |
| **Changed** | Changes to existing functionality | "Changed agent status UI layout" |
| **Deprecated** | Soon-to-be removed features | "Deprecated old workflow API endpoints" |
| **Removed** | Removed features | "Removed legacy agent executor" |
| **Fixed** | Bug fixes | "Fixed memory leak in workflow monitor" |
| **Security** | Security patches | "Patched SQL injection vulnerability" |

### 4.3 Entry Guidelines

**Good Changelog Entries**:
```markdown
### Added
- **Multi-agent orchestration**: New dashboard for coordinating multiple agents simultaneously (#234)
- **Workflow templates**: Pre-built templates for common use cases (20+ templates available)
- **Real-time collaboration**: Multiple users can now edit workflows together (#156)

### Fixed
- **Workflow execution**: Fixed timeout bug affecting long-running workflows (#123)
- **Dashboard performance**: Reduced initial load time by 60% through code splitting (#145)
- **Agent profiles**: Corrected capability validation logic (#178)

### Security
- **XSS Prevention**: Sanitized agent description input to prevent cross-site scripting (CVE-2026-0001)
```

**Poor Changelog Entries** (Too Vague):
```markdown
### Added
- New feature
- Some improvements
- Various updates

### Fixed
- Bug fix
- Issue resolved
```

---

## 5. Release Process

### 5.1 Release Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                   Release Workflow                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Development          [feature branches]                 │
│            ↓                                                 │
│  2. Version Bump         [update package.json]              │
│            ↓                                                 │
│  3. Changelog Update     [update CHANGELOG.md]              │
│            ↓                                                 │
│  4. Testing              [run test suite]                   │
│            ↓                                                 │
│  5. Code Review          [PR approval]                      │
│            ↓                                                 │
│  6. Merge to Main        [merge PR]                         │
│            ↓                                                 │
│  7. Tag Release          [git tag v1.2.0]                   │
│            ↓                                                 │
│  8. Build & Deploy       [CI/CD pipeline]                   │
│            ↓                                                 │
│  9. Release Notes        [GitHub release]                   │
│            ↓                                                 │
│  10. Announcement        [notify stakeholders]              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Step-by-Step Guide

#### Step 1: Determine Version Number

```bash
# Current version: 1.2.3

# For bug fix
New version: 1.2.4 (PATCH)

# For new feature
New version: 1.3.0 (MINOR)

# For breaking change
New version: 2.0.0 (MAJOR)
```

#### Step 2: Update package.json

```json
{
  "name": "base44-app",
  "version": "1.3.0",
  "private": true,
  ...
}
```

#### Step 3: Update CHANGELOG.md

```markdown
## [1.3.0] - 2026-01-15

### Added
- Multi-agent orchestration dashboard (#234)
- Workflow template library with 20+ templates (#245)
- Real-time collaboration for workflows (#156)

### Changed
- Improved dashboard loading performance (60% faster) (#145)
- Updated agent card UI design (#189)

### Fixed
- Fixed workflow execution timeout bug (#123)
- Corrected capability validation logic (#178)

### Security
- Patched XSS vulnerability in agent descriptions (CVE-2026-0001)

[1.3.0]: https://github.com/Krosebrook/orchestrator-ai/compare/v1.2.3...v1.3.0
```

#### Step 4: Create Git Tag

```bash
# Create annotated tag
git tag -a v1.3.0 -m "Release version 1.3.0"

# Push tag to remote
git push origin v1.3.0
```

#### Step 5: Create GitHub Release

1. Go to GitHub repository
2. Navigate to "Releases"
3. Click "Draft a new release"
4. Select tag `v1.3.0`
5. Add release title: "v1.3.0 - Multi-Agent Orchestration"
6. Copy content from CHANGELOG.md
7. Publish release

### 5.3 Automated Release (GitHub Actions)

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          body_path: ./CHANGELOG.md
          draft: false
          prerelease: false
      
      - name: Deploy
        run: npm run deploy
        env:
          DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
```

---

## 6. Breaking Changes

### 6.1 Handling Breaking Changes

**Documentation Requirements**:
1. Document in CHANGELOG.md under "Changed" or "Removed"
2. Provide migration guide
3. Update API documentation
4. Add deprecation warnings in previous minor version

**Example**:
```markdown
## [2.0.0] - 2026-03-01

### Removed
- **Legacy Workflow API v1**: Removed deprecated API endpoints
  - **Migration Guide**: See [MIGRATION_v1_to_v2.md](./docs/MIGRATION_v1_to_v2.md)
  - **Breaking Change**: All clients must update to API v2
  - **Endpoints Affected**:
    - `POST /api/v1/workflows` → Use `POST /api/v2/workflows`
    - `GET /api/v1/workflows/{id}` → Use `GET /api/v2/workflows/{id}`

### Changed
- **Authentication**: Switched from OAuth 1.0 to OAuth 2.0
  - **Migration Guide**: Update client credentials and token refresh logic
  - **See**: [OAuth2_Migration.md](./docs/OAuth2_Migration.md)
```

### 6.2 Deprecation Process

**Timeline**:
1. **Version N**: Feature works normally
2. **Version N+1** (MINOR): Deprecation warning added
3. **Version N+2** (MINOR): Deprecation warning enhanced
4. **Version N+3** (MAJOR): Feature removed

**Example**:
```
Version 1.5.0:  Feature works normally
Version 1.6.0:  Deprecation warning: "This feature will be removed in v2.0.0"
Version 1.7.0:  Enhanced warning: "DEPRECATED: Use new API instead"
Version 2.0.0:  Feature removed
```

**Code Example**:
```javascript
/**
 * @deprecated Use getAgentV2() instead. Will be removed in v2.0.0
 */
export function getAgent(id) {
  console.warn(
    'DEPRECATED: getAgent() is deprecated and will be removed in v2.0.0. ' +
    'Use getAgentV2() instead.'
  );
  return getAgentV2(id);
}
```

---

## 7. Version Ranges & Dependencies

### 7.1 Dependency Version Ranges

**Symbols**:
- `^1.2.3` - Compatible with 1.2.3, allows MINOR and PATCH updates (^1.2.3 = >=1.2.3 <2.0.0)
- `~1.2.3` - Approximately 1.2.3, allows PATCH updates only (~1.2.3 = >=1.2.3 <1.3.0)
- `>=1.2.3` - Greater than or equal to 1.2.3
- `1.2.x` - Any PATCH version of 1.2
- `*` - Any version (not recommended)

**Recommendations**:
```json
{
  "dependencies": {
    "react": "^18.2.0",              // Allow minor updates
    "@base44/sdk": "~0.8.3",         // Only patch updates (stable API)
    "@radix-ui/react-dialog": "^1.1.6" // Allow minor updates
  },
  "devDependencies": {
    "vite": "^6.1.0",                // Allow minor updates
    "vitest": "^4.0.16"              // Allow minor updates
  }
}
```

### 7.2 Lock Files

**Purpose**: Ensure reproducible builds

**package-lock.json**:
- Locks exact versions of all dependencies
- Includes transitive dependencies
- Committed to repository
- Used in CI/CD for consistent builds

**Updating Dependencies**:
```bash
# Update to latest within range
npm update

# Update to latest (may break)
npm install <package>@latest

# Check for outdated packages
npm outdated

# Audit for security vulnerabilities
npm audit
npm audit fix
```

---

## 8. Hotfix Process

### 8.1 Emergency Patch Releases

**Scenario**: Critical bug in production (version 1.3.0)

**Process**:
```bash
# 1. Create hotfix branch from release tag
git checkout -b hotfix/1.3.1 v1.3.0

# 2. Fix the bug
# ... make changes ...

# 3. Update version to 1.3.1
# Edit package.json

# 4. Update CHANGELOG.md
## [1.3.1] - 2026-01-16

### Fixed
- **CRITICAL**: Fixed data corruption bug in workflow execution (#267)

# 5. Commit and tag
git add .
git commit -m "Fix: Critical workflow execution bug"
git tag -a v1.3.1 -m "Hotfix: Critical bug fix"

# 6. Merge to main and develop
git checkout main
git merge hotfix/1.3.1
git push origin main --tags

# 7. Deploy immediately
npm run deploy:production
```

---

## 9. Version History

### 9.1 Release Timeline (Example)

```
2025-01-07    v0.0.0     Initial release
2026-01-08    v0.1.0     Documentation updates
2026-01-15    v1.0.0     First stable release
2026-02-01    v1.1.0     Workflow templates feature
2026-02-15    v1.1.1     Bug fixes
2026-03-01    v1.2.0     Multi-agent orchestration
2026-03-15    v1.2.1     Performance improvements
2026-04-01    v2.0.0     Major API redesign (breaking changes)
```

### 9.2 Version Support Policy

| Version | Status | Support End | Notes |
|---------|--------|-------------|-------|
| **2.x.x** | Active | TBD | Current major version |
| **1.x.x** | Maintenance | 2027-04-01 | Bug fixes and security patches only |
| **0.x.x** | Deprecated | 2026-04-01 | No longer supported |

**Support Levels**:
- **Active**: Full support (features, bug fixes, security)
- **Maintenance**: Critical bug fixes and security patches only
- **Deprecated**: No support, upgrade strongly recommended

---

## 10. Tools and Automation

### 10.1 Semantic Release

**Automated version bumping based on commit messages**:

```bash
# Install
npm install --save-dev semantic-release

# Commit message format
feat: add workflow templates        # Triggers MINOR bump
fix: correct validation logic       # Triggers PATCH bump
feat!: redesign agent API           # Triggers MAJOR bump (breaking)

BREAKING CHANGE: API redesigned     # Also triggers MAJOR bump
```

### 10.2 Changelog Generation

**Automated changelog from commits**:

```bash
# Using conventional-changelog
npm install --save-dev conventional-changelog-cli

# Generate changelog
npx conventional-changelog -p angular -i CHANGELOG.md -s

# Commit conventions
# feat: New feature
# fix: Bug fix
# docs: Documentation changes
# style: Code style changes
# refactor: Code refactoring
# perf: Performance improvements
# test: Test updates
# chore: Build/tooling changes
```

---

## 11. Related Documents

- [CHANGELOG.md](./CHANGELOG.md) - Actual project changelog
- [DOC_POLICY.md](./DOC_POLICY.md) - Documentation versioning
- [ROADMAP.md](./ROADMAP.md) - Feature release timeline
- [API_REFERENCE.md](./API_REFERENCE.md) - API versioning

---

## 12. Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-08 | Initial semantic versioning documentation | Release Team |

---

**Review Cycle**: Quarterly  
**Next Review**: April 8, 2026
