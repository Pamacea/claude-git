# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- (Coming soon)

## [1.3.0] - 2025-02-11

### Added
- feat: add user authentication with OAuth2
- feat(ui): implement dark mode toggle
- feat(api): add pagination to list endpoints

### Fixed
- fix(api): resolve race condition in payment processing
- fix(auth): handle token refresh errors
- fix(ui): prevent memory leak in event handlers

### Changed
- refactor(auth): simplify login flow
- BREAKING CHANGE: Remove deprecated authentication endpoint

### Documentation
- docs: update getting started guide
- docs(api): document new authentication endpoints

### Internal
- style: format code with prettier
- test: add integration tests for checkout flow
- build: upgrade to Next.js 15

## [1.2.0] - 2025-01-15

### Added
- feat: implement user profile management
- feat(api): add rate limiting
- feat(ui): add loading skeletons

### Fixed
- fix: resolve timeout issues in API calls
- fix(ui): fix mobile responsive issues

### Performance
- perf: optimize database queries
- perf: implement response caching

## [1.1.0] - 2024-12-01

### Added
- feat: add search functionality
- feat(api): implement filtering and sorting

### Fixed
- fix(api): handle edge cases in data validation

### Documentation
- docs: add API documentation
- docs: create deployment guide

## [1.0.0] - 2024-11-01

### Added
- feat: initial release
- feat: core application features
- feat: authentication system
- feat: database integration
- feat: API endpoints

### Documentation
- docs: create README
- docs: add contributing guidelines

---

## Section Guidelines

### Added
New features (use `feat:` commits)

### Fixed
Bug fixes (use `fix:` commits)

### Changed
Changes to existing functionality (use `refactor:`, `feat!` commits)

### Deprecated
Soon-to-be removed features

### Removed
Removed features (use `BREAKING CHANGE`)

### Fixed
Bug fixes

### Security
Security vulnerability fixes

### Performance
Performance improvements (use `perf:` commits)

### Documentation
Documentation changes (use `docs:` commits)

### Internal
Internal changes (use `style:`, `test:`, `build:`, `ci:`, `chore:` commits)
