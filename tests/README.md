# Test Suite

This directory contains the Vitest test suite for the Aureus plugin.

## Structure

```
tests/
├── vitest.setup.ts           # Global test configuration
├── unit/                      # Unit tests
│   ├── convention/           # Commit message convention tests
│   │   └── parser.test.ts
│   ├── git/                  # Git operations tests
│   │   └── validation.test.ts
│   ├── security/             # Security tests
│   │   └── sanitization.test.ts
│   ├── version/              # Version handling tests
│   │   └── handler.test.ts
│   └── utils/                # Utility functions tests
│       └── helpers.test.ts
```

## Running Tests

```bash
# Run all tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Coverage Goals

- **Statements:** 70%
- **Branches:** 70%
- **Functions:** 70%
- **Lines:** 70%

## Test Categories

### Convention Tests
- Commit message parsing
- Version format validation
- Type validation (RELEASE, UPDATE, PATCH)

### Git Validation Tests
- Path sanitization
- Repository path validation
- Command injection prevention

### Security Tests
- Input sanitization
- Path traversal prevention
- Command injection detection
- Rate limiting validation
- CSP configuration

### Version Handler Tests
- Version parsing
- Version bumping (SemVer)
- Version comparison

### Utility Tests
- String manipulation
- Array operations
- Promise utilities
- Retry logic

## Writing New Tests

1. Place test files in the appropriate subdirectory under `unit/`
2. Name files with `.test.ts` suffix
3. Use `describe()` to group related tests
4. Use `it()` for individual test cases
5. Use `expect()` for assertions

Example:

```typescript
import { describe, it, expect } from 'vitest'

describe('My Feature', () => {
  it('should do something', () => {
    expect(true).toBe(true)
  })
})
```

## CI/CD Integration

Tests run automatically in CI/CD pipeline. Ensure all tests pass before committing.
