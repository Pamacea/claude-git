/**
 * Commit Message Convention Parser Tests
 * Tests for the Versioned Release Convention parser
 */

import { describe, it, expect } from 'vitest'

// Import the functions we're testing
// Since server.js is CommonJS, we'll need to extract and test the logic
// For now, we'll recreate the functions in TypeScript for testing

function parseCommitMessage(message: string): {
  valid: boolean
  error?: string
  parsed?: {
    type: string
    version: string
    project: string
  }
} {
  if (!message) {
    return { valid: false, error: 'Message is required' }
  }

  const subject = message.split('\n')[0]
  const pattern = /^(RELEASE|UPDATE|PATCH): [A-Za-z0-9_ -]+ - v[0-9]+\.[0-9]+\.[0-9]+/

  if (!pattern.test(subject)) {
    return {
      valid: false,
      error: 'Message must follow Versioned Release Convention format',
      parsed: null,
    }
  }

  const typeMatch = subject.match(/^(RELEASE|UPDATE|PATCH)/)
  const versionMatch = subject.match(/v[0-9]+\.[0-9]+\.[0-9]+/)
  const projectMatch = subject.match(/^(RELEASE|UPDATE|PATCH): ([A-Za-z0-9_ -]+) - v/)

  return {
    valid: true,
    parsed: {
      type: typeMatch ? typeMatch[1] : null,
      version: versionMatch ? versionMatch[0] : null,
      project: projectMatch ? projectMatch[2].trim() : null,
    },
  }
}

describe('Commit Message Parser', () => {
  describe('Valid PATCH messages', () => {
    it('should accept a simple PATCH message', () => {
      const result = parseCommitMessage('PATCH: My Project - v1.0.1')
      expect(result.valid).toBe(true)
      expect(result.parsed?.type).toBe('PATCH')
      expect(result.parsed?.version).toBe('v1.0.1')
      expect(result.parsed?.project).toBe('My Project')
    })

    it('should accept PATCH message with body', () => {
      const message = 'PATCH: My Project - v1.0.1\n\n- Fixed bug\n- Improved performance'
      const result = parseCommitMessage(message)
      expect(result.valid).toBe(true)
      expect(result.parsed?.type).toBe('PATCH')
    })

    it('should accept PATCH with special characters in project name', () => {
      const result = parseCommitMessage('PATCH: My-Project_Name 123 - v1.0.1')
      expect(result.valid).toBe(true)
      expect(result.parsed?.project).toBe('My-Project_Name 123')
    })
  })

  describe('Valid UPDATE messages', () => {
    it('should accept a simple UPDATE message', () => {
      const result = parseCommitMessage('UPDATE: My Project - v1.1.0')
      expect(result.valid).toBe(true)
      expect(result.parsed?.type).toBe('UPDATE')
      expect(result.parsed?.version).toBe('v1.1.0')
    })

    it('should accept UPDATE message with body', () => {
      const message = `UPDATE: My App - v1.2.0

- Added new feature
- Fixed bug
- Improved docs`
      const result = parseCommitMessage(message)
      expect(result.valid).toBe(true)
      expect(result.parsed?.type).toBe('UPDATE')
      expect(result.parsed?.version).toBe('v1.2.0')
    })
  })

  describe('Valid RELEASE messages', () => {
    it('should accept a simple RELEASE message', () => {
      const result = parseCommitMessage('RELEASE: My Project - v2.0.0')
      expect(result.valid).toBe(true)
      expect(result.parsed?.type).toBe('RELEASE')
      expect(result.parsed?.version).toBe('v2.0.0')
    })

    it('should accept RELEASE with major version bump', () => {
      const result = parseCommitMessage('RELEASE: My Project - v10.0.0')
      expect(result.valid).toBe(true)
      expect(result.parsed?.version).toBe('v10.0.0')
    })
  })

  describe('Invalid messages', () => {
    it('should reject message without type', () => {
      const result = parseCommitMessage('My Project - v1.0.1')
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should reject message without version', () => {
      const result = parseCommitMessage('PATCH: My Project')
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should reject message with invalid type', () => {
      const result = parseCommitMessage('INVALID: My Project - v1.0.1')
      expect(result.valid).toBe(false)
    })

    it('should reject message with malformed version (missing v)', () => {
      const result = parseCommitMessage('PATCH: My Project - 1.0.1')
      expect(result.valid).toBe(false)
    })

    it('should reject message with malformed version (missing numbers)', () => {
      const result = parseCommitMessage('PATCH: My Project - v1.0')
      expect(result.valid).toBe(false)
    })

    it('should reject empty message', () => {
      const result = parseCommitMessage('')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Message is required')
    })

    it('should reject lowercase type (case-sensitive)', () => {
      const result = parseCommitMessage('patch: My Project - v1.0.1')
      expect(result.valid).toBe(false)
    })

    it('should reject mixed case type', () => {
      const result = parseCommitMessage('Patch: My Project - v1.0.1')
      expect(result.valid).toBe(false)
    })
  })

  describe('Edge cases', () => {
    it('should handle version with leading zeros', () => {
      const result = parseCommitMessage('PATCH: My Project - v0.0.1')
      expect(result.valid).toBe(true)
      expect(result.parsed?.version).toBe('v0.0.1')
    })

    it('should handle project name with multiple spaces', () => {
      const result = parseCommitMessage('PATCH: My   Project   Name - v1.0.1')
      expect(result.valid).toBe(true)
      expect(result.parsed?.project).toBe('My   Project   Name')
    })

    it('should handle project name with numbers', () => {
      const result = parseCommitMessage('PATCH: Project123 - v1.0.1')
      expect(result.valid).toBe(true)
      expect(result.parsed?.project).toBe('Project123')
    })

    it('should handle project name with underscores', () => {
      const result = parseCommitMessage('PATCH: my_project_name - v1.0.1')
      expect(result.valid).toBe(true)
      expect(result.parsed?.project).toBe('my_project_name')
    })

    it('should handle project name with hyphens', () => {
      const result = parseCommitMessage('PATCH: my-project-name - v1.0.1')
      expect(result.valid).toBe(true)
      expect(result.parsed?.project).toBe('my-project-name')
    })

    it('should ignore body text when parsing type/version/project', () => {
      const message = `PATCH: Project - v1.0.1

RELEASE: Fake Project - v9.9.9
UPDATE: Another Fake - v8.8.8`
      const result = parseCommitMessage(message)
      expect(result.valid).toBe(true)
      expect(result.parsed?.type).toBe('PATCH')
      expect(result.parsed?.version).toBe('v1.0.1')
    })
  })

  describe('Version edge cases', () => {
    it('should handle very large version numbers', () => {
      const result = parseCommitMessage('PATCH: Project - v999.999.999')
      expect(result.valid).toBe(true)
      expect(result.parsed?.version).toBe('v999.999.999')
    })

    it('should handle single digit versions', () => {
      const result = parseCommitMessage('PATCH: Project - v1.2.3')
      expect(result.valid).toBe(true)
      expect(result.parsed?.version).toBe('v1.2.3')
    })
  })
})
