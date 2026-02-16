# Git Flow Master - Test Suite

Complete test suite for Git Flow Master plugin.

## Running Tests

### Run All Tests
```bash
node tests/run-tests.js
```

### Run Individual Tests
```bash
# Dependency installation tests
node tests/test-dependencies.js

# Commit message validation tests
node tests/test-validation.js

# Security tests
node tests/test-security.js

# Server tests (requires manual server start)
node tests/test-server.js
```

## Test Coverage

### 1. Dependencies (test-dependencies.js)
- ✓ package.json exists and is valid
- ✓ node_modules directory exists
- ✓ express module is installed
- ✓ helmet module is installed
- ✓ server.js can load dependencies
- ✓ install-dependencies.js script works

### 2. Validation (test-validation.js)
- ✓ Valid PATCH message
- ✓ Valid UPDATE message
- ✓ Valid RELEASE message
- ✓ Message with body
- ✓ Invalid message without type
- ✓ Invalid message without version
- ✓ Invalid message with wrong type case
- ✓ Invalid message with malformed version
- ✓ Empty message rejection
- ✓ Special characters in project name
- ✓ Multi-line body support

### 3. Security (test-security.js)
- ✓ Security headers present
- ✓ Command injection prevention
- ✓ Path traversal prevention
- ✓ Input sanitization
- ✓ CSRF token generation
- ✓ Rate limiting implementation
- ✓ Helmet security headers
- ✓ Uses spawn instead of exec
- ✓ Shell false option
- ✓ Input validation

### 4. Server (test-server.js)
- ✓ Server responds to HTTP requests
- ✓ GET /api/config returns configuration
- ✓ GET /api/state returns state
- ✓ GET /api/csrf-token returns token
- ✓ GET /api/suggest/types returns commit types
- ✓ POST /api/validate/message validates messages

## Test Results

All tests must pass before committing and releasing.

```
✅ All dependency tests passed!
✅ All validation tests passed!
✅ All security tests passed!
✅ All server tests passed!
```
