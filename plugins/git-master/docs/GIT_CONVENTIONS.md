# Git Conventions

> Complete reference for Git workflow conventions in this project

---

## Conventional Commits

### Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Rules

1. **Type** - Required, must be one of:
   - `feat` - A new feature
   - `fix` - A bug fix
   - `docs` - Documentation only
   - `style` - Code style (formatting, etc)
   - `refactor` - Code refactoring
   - `perf` - Performance improvements
   - `test` - Adding/updating tests
   - `build` - Build system or dependencies
   - `ci` - CI/CD configuration
   - `chore` - Other changes
   - `revert` - Revert a commit

2. **Scope** - Optional, noun describing affected section
   - Example: `feat(auth):`, `fix(api):`, `docs(guide):`

3. **Description** - Required
   - Use imperative, present tense: "add" not "added"
   - Don't capitalize first letter
   - No period (.) at the end
   - Max 80 characters

4. **Body** - Optional for complex changes
   - Explain what and why
   - Wrap at 100 characters

5. **Footer** - Optional
   - Breaking changes: `BREAKING CHANGE: description`
   - Closes issues: `Closes #123`

### Examples

#### Good Examples

```
feat: add user authentication

Implement OAuth2 login flow with Google and GitHub providers.
Includes session management and token refresh logic.

Closes #42
```

```
fix(api): resolve race condition in payment processing

The race condition occurred when multiple payment requests
were processed simultaneously, causing duplicate charges.
```

```
feat!: remove deprecated authentication endpoint

BREAKING CHANGE: The /auth/legacy endpoint has been removed.
Use /auth/oauth instead.
```

```
docs: update installation guide with new prerequisites

Added Node.js 18+ requirement and updated all code examples
to reflect the latest API changes.
```

#### Bad Examples

```
❌ Added new feature
❌ Fix bug
❌ Updates
❌ feat: Added new feature (capitalized)
❌ feat: add new feature. (period)
❌ feat: add new feature (too vague)
❌ feat(auth): Add User Authentication (capitalized)
```

---

## Semantic Versioning

### Version Format

```
MAJOR.MINOR.PATCH

Example: 1.3.0
```

### Bump Rules

#### MAJOR (X.0.0)

Bump when:
- Commit includes `!` after type/scope
- Footer contains `BREAKING CHANGE:`

Examples:
```
feat!: remove deprecated API
fix(api)!: breaking change to authentication
BREAKING CHANGE: Remove support for legacy auth
```

#### MINOR (0.X.0)

Bump when:
- Commit type is `feat` (without breaking change)

Examples:
```
feat: add user authentication
feat(ui): add dark mode
feat(api): add pagination
```

#### PATCH (0.0.X)

Bump when:
- Commit type is `fix`, `perf`, `docs`, `style`, `refactor`, `test`, `build`, `ci`, `chore`

Examples:
```
fix: resolve timeout issue
docs: update README
perf: optimize database queries
style: format code with prettier
```

### Version precedence

```
1.0.0 < 2.0.0
1.0.0 < 1.1.0
1.0.0 < 1.0.1
1.2.0-beta < 1.2.0
```

---

## Branch Naming

### Format

```
<prefix>/<short-description>
```

### Prefixes

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feature/` | New features | `feature/user-auth` |
| `fix/` | Bug fixes | `fix/payment-timeout` |
| `hotfix/` | Production hotfixes | `hotfix/security-patch` |
| `release/` | Release preparation | `release/v1.3.0` |
| `docs/` | Documentation | `docs/api-guide` |
| `refactor/` | Refactoring | `refactor/auth-service` |
| `test/` | Test changes | `test/add-integration-tests` |
| `chore/` | Chores | `chore/update-dependencies` |

### Naming Guidelines

- Use kebab-case for descriptions
- Keep descriptions short and descriptive
- Use issue numbers when applicable: `feature/ISSUE-123-user-auth`

Examples:
```
✅ Good:
feature/user-authentication
fix/payment-timeout
hotfix/456-security-patch
docs/api-getting-started

❌ Bad:
feature/NewUserAuthenticationFeature
fix/issue
hotfix/FIX
```

---

## Pull Request Convention

### PR Title

Use Conventional Commits format:

```
feat: add user authentication
fix(api): resolve race condition
docs: update installation guide
```

### PR Description Template

```markdown
## Summary
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking)
- [ ] New feature (non-breaking)
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Fixes #
Relates to #

## Changes Made
-
-

## How to Test
1.
2.
3.

## Checklist
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No new warnings
```

### PR Labels

Auto-applied based on commit types:

| Commit Type | PR Label |
|-------------|----------|
| `feat` | `enhancement` |
| `fix` | `bug` |
| `docs` | `documentation` |
| `style` | `style` |
| `refactor` | `refactor` |
| `perf` | `performance` |
| `test` | `testing` |
| `build` | `build` |
| `ci` | `ci` |
| `chore` | `chore` |

### PR Merge Strategy

- **Squash and merge** (default)
  - Clean history
  - Single commit per PR

- **Merge commit** (for large features)
  - Preserves branch history
  - Multiple commits visible

- **Rebase and merge** (rare)
  - Linear history
  - Use only for personal branches

---

## Release Process

### Pre-Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] No uncommitted changes
- [ ] Branch is up to date with main

### Creating a Release

1. **Merge all PRs** to main branch
2. **Update version** in package.json
3. **Generate CHANGELOG** from commits
4. **Create git tag** with version
5. **Push to remote**
6. **Create GitHub release**

### Release Branch Workflow

For larger releases:

```bash
# Create release branch
git checkout -b release/v1.3.0

# Bump version
# Update CHANGELOG
# Final testing

# Merge to main
git checkout main
git merge release/v1.3.0

# Create tag
git tag -a v1.3.0 -m "Release v1.3.0"

# Push
git push origin main --tags
```

### Hotfix Workflow

```bash
# Create hotfix branch from main
git checkout main
git checkout -b hotfix/v1.3.1

# Apply fix
git commit -m "fix: resolve critical security issue"

# Merge back to main AND develop
git checkout main
git merge hotfix/v1.3.1

# Create tag
git tag -a v1.3.1 -m "Hotfix v1.3.1"
git push origin main --tags
```

---

## Commit Message Examples by Type

### feat (New Feature)

```
feat: add dark mode toggle

Implement dark mode theme with system preference detection
and manual toggle in user settings. Includes theme persistence
across sessions.

Closes #123
```

```
feat(auth): implement OAuth2 login

Add OAuth2 authentication with Google and GitHub providers.
Includes token refresh logic and session management.
```

### fix (Bug Fix)

```
fix: resolve memory leak in event handler

Fixed memory leak caused by not removing event listeners
on component unmount. Now properly cleans up in useEffect.
```

```
fix(api): handle timeout in payment processing

Added timeout handling to prevent infinite waiting when
payment gateway is unresponsive. Retries 3 times before failing.
```

### docs (Documentation)

```
docs: update getting started guide

Added prerequisite section and updated all installation
commands to use the latest package manager syntax.
```

```
docs(api): document authentication endpoints

Added comprehensive documentation for all authentication
endpoints including request/response examples.
```

### style (Code Style)

```
style: format code with prettier

Ran prettier on all source files to ensure consistent formatting.
No functional changes.
```

### refactor (Refactoring)

```
refactor(auth): simplify login flow

Refactored authentication logic to use a single service
function instead of multiple scattered functions.
No functional changes.
```

### perf (Performance)

```
perf: optimize database queries

Added database indexes and optimized query structure.
Reduced query time by 60% on large datasets.
```

### test (Tests)

```
test: add integration tests for checkout flow

Added end-to-end tests covering the complete checkout
process including payment confirmation and order creation.
```

### build (Build System)

```
build: upgrade to Next.js 15

Upgraded Next.js to version 15 and updated all deprecated
APIs to use the new syntax.
```

### ci (CI/CD)

```
ci: add automated deployment workflow

Added GitHub Actions workflow for automated deployment
to staging environment on push to develop branch.
```

### chore (Chores)

```
chore: update dependencies

Updated all production dependencies to their latest
versions as per dependency audit report.
```

### revert (Revert)

```
revert: feat: add experimental feature

Reverts commit abc123 due to performance issues.
Will be re-implemented with optimizations.
```

---

## Gitignore Patterns

Add to `.gitignore`:

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Build output
dist/
build/
.next/
out/

# Environment files
.env
.env*.local
.env.production

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Testing
coverage/
.nyc_output/

# Misc
*.pem
*.key
secrets/
```

---

## Troubleshooting

### Common Issues

**Issue**: Commit rejected by hook
```
Solution: Your commit message doesn't follow Conventional Commits
Format: <type>: <description>
Example: feat: add new feature
```

**Issue**: Pre-commit hook fails
```
Solution: Fix linting/typecheck errors or skip hook (not recommended)
git commit --no-verify
```

**Issue**: Release already exists
```
Solution: Delete the remote tag and re-release
git push origin :refs/tags/v1.3.0
git tag -d v1.3.0
# Re-run release
```

---

## Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [GitHub Flow](https://docs.github.com/en/get-started/quickstart/github-flow)
