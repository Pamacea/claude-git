/**
 * Vitest Setup File
 * Global test configuration and fixtures
 */

import { vi } from 'vitest'

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to silence console.log in tests
  // log: vi.fn(),
  // debug: vi.fn(),
  // info: vi.fn(),
  // warn: vi.fn(),
  // error: vi.fn(),
}

// Mock process.cwd() for consistent test behavior
vi.stubGlobal('process', {
  ...process,
  cwd: () => '/test/workspace',
})

// Mock os.homedir() for consistent test behavior
vi.mock('os', () => ({
  default: {
    homedir: () => '/home/test',
    platform: () => 'linux',
    tmpdir: () => '/tmp',
  },
  homedir: () => '/home/test',
  platform: () => 'linux',
  tmpdir: () => '/tmp',
}))

// Global test utilities
declare global {
  namespace Vi {
    interface JestAssertion<T = any> extends jest.Matchers<void, T> {}
  }
}

// Test timeout for async operations
vi.setConfig({ testTimeout: 10000 })
