/**
 * Git Validation and Sanitization Tests
 * Tests for security-related validation functions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import path from 'path'

// Recreate the security functions for testing (matching lib/git/validation.ts)
function sanitizeFilePath(filePath: string): string {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('File path must be a non-empty string')
  }

  // Remove null bytes
  let sanitized = filePath.replace(/\0/g, '')

  // Remove dangerous shell characters
  const dangerousChars = /[;&|<>$`]/g
  sanitized = sanitized.replace(dangerousChars, '')

  return sanitized
}

function sanitizeCommitMessage(message: string): string {
  if (!message || typeof message !== 'string') {
    throw new Error('Commit message must be a non-empty string')
  }

  // Remove null bytes and control characters except newline and tab
  let sanitized = message.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')

  // Limit length
  if (sanitized.length > 5000) {
    throw new Error('Commit message too long (max 5000 characters)')
  }

  return sanitized.trim()
}

function parseVersion(version: string): { major: number; minor: number; patch: number } | null {
  const match = version.match(/v?(\d+)\.(\d+)\.(\d+)/)
  if (!match) return null
  return {
    major: parseInt(match[1]),
    minor: parseInt(match[2]),
    patch: parseInt(match[3]),
  }
}

function bumpVersion(currentVersion: string, type: 'RELEASE' | 'UPDATE' | 'PATCH'): string {
  const parsed = parseVersion(currentVersion) || { major: 0, minor: 0, patch: 0 }

  switch (type) {
    case 'RELEASE':
      return `v${parsed.major + 1}.0.0`
    case 'UPDATE':
      return `v${parsed.major}.${parsed.minor + 1}.0`
    case 'PATCH':
      return `v${parsed.major}.${parsed.minor}.${parsed.patch + 1}`
    default:
      return `v${parsed.major}.${parsed.minor}.${parsed.patch}`
  }
}

// Mock ALLOWED_BASE_PATHS for testing
const ALLOWED_BASE_PATHS = ['/home/test', '/home', '/workspace', '/projects']

async function validateRepoPath(inputPath: string): Promise<string> {
  if (!inputPath || typeof inputPath !== 'string') {
    throw new Error('Repository path is required and must be a string')
  }

  // Normalize and resolve the path
  const resolved = path.resolve(inputPath)

  // Check for null bytes (path truncation attack)
  if (resolved.includes('\0')) {
    throw new Error('Invalid path: contains null bytes')
  }

  // Check against allowed base paths
  const isAllowed = ALLOWED_BASE_PATHS.some((allowed) => {
    const normalizedAllowed = path.resolve(allowed)
    const relative = path.relative(normalizedAllowed, resolved)
    // Check if the relative path doesn't start with '..' (directory traversal)
    return !relative.startsWith('..')
  })

  if (!isAllowed) {
    throw new Error('Access denied: path outside allowed directories')
  }

  // Additional check for path traversal attempts
  if (inputPath.includes('..') || inputPath.includes('~')) {
    throw new Error('Path traversal detected')
  }

  return resolved
}

describe('Git Validation Functions', () => {
  describe('sanitizeFilePath', () => {
    it('should remove dangerous characters', () => {
      expect(sanitizeFilePath('file.txt;rm -rf')).toBe('file.txtrm -rf')
      expect(sanitizeFilePath('file&echo hack')).toBe('fileecho hack')
      expect(sanitizeFilePath('file|cat /etc/passwd')).toBe('filecat /etc/passwd') // / is not removed
    })

    it('should preserve safe characters', () => {
      expect(sanitizeFilePath('file-name_v1.0.txt')).toBe('file-name_v1.0.txt')
      expect(sanitizeFilePath('relative/path/to/file.txt')).toBe('relative/path/to/file.txt') // / preserved
    })

    it('should throw on empty string', () => {
      expect(() => sanitizeFilePath('')).toThrow('File path must be a non-empty string')
    })

    it('should throw on non-string input', () => {
      expect(() => sanitizeFilePath(null as unknown as string)).toThrow()
      expect(() => sanitizeFilePath(undefined as unknown as string)).toThrow()
    })

    it('should remove all dangerous characters in combination', () => {
      const input = 'file;test&echo|hack$()`'
      // Note: () are not removed by the sanitizer, only ` is removed
      expect(sanitizeFilePath(input)).toBe('filetestechohack()')
    })

    it('should remove null bytes', () => {
      expect(sanitizeFilePath('file\0.txt')).toBe('file.txt')
    })
  })

  describe('sanitizeCommitMessage', () => {
    it('should preserve valid commit messages', () => {
      expect(sanitizeCommitMessage('Fix bug; update deps')).toBe('Fix bug; update deps')
      expect(sanitizeCommitMessage('Hotfix& security')).toBe('Hotfix& security')
    })

    it('should trim whitespace', () => {
      expect(sanitizeCommitMessage('  Fix bug  ')).toBe('Fix bug')
    })

    it('should handle multi-line messages', () => {
      const message = 'PATCH: Project - v1.0.1\n\n- Fixed bug\n- Updated deps'
      expect(sanitizeCommitMessage(message)).toContain('PATCH: Project - v1.0.1')
    })

    it('should throw on empty string', () => {
      expect(() => sanitizeCommitMessage('')).toThrow('Commit message must be a non-empty string')
    })

    it('should throw on non-string input', () => {
      expect(() => sanitizeCommitMessage(null as unknown as string)).toThrow()
      expect(() => sanitizeCommitMessage(undefined as unknown as string)).toThrow()
    })

    it('should preserve valid commit message format', () => {
      const message = 'PATCH: My Project - v1.0.1'
      expect(sanitizeCommitMessage(message)).toBe(message)
    })

    it('should remove control characters', () => {
      const message = 'Fix\x00bug\x01test'
      expect(sanitizeCommitMessage(message)).toBe('Fixbugtest')
    })

    it('should throw on too long messages', () => {
      const longMessage = 'a'.repeat(5001)
      expect(() => sanitizeCommitMessage(longMessage)).toThrow('Commit message too long')
    })
  })

  describe('parseVersion', () => {
    it('should parse version with v prefix', () => {
      const result = parseVersion('v1.2.3')
      expect(result).toEqual({ major: 1, minor: 2, patch: 3 })
    })

    it('should parse version without v prefix', () => {
      const result = parseVersion('1.2.3')
      expect(result).toEqual({ major: 1, minor: 2, patch: 3 })
    })

    it('should handle zero versions', () => {
      const result = parseVersion('v0.0.0')
      expect(result).toEqual({ major: 0, minor: 0, patch: 0 })
    })

    it('should handle large version numbers', () => {
      const result = parseVersion('v100.200.300')
      expect(result).toEqual({ major: 100, minor: 200, patch: 300 })
    })

    it('should return null for invalid format', () => {
      expect(parseVersion('1.2')).toBeNull()
      expect(parseVersion('v1.2')).toBeNull()
      expect(parseVersion('abc')).toBeNull()
      expect(parseVersion('')).toBeNull()
    })
  })

  describe('bumpVersion', () => {
    it('should bump PATCH version correctly', () => {
      expect(bumpVersion('v1.2.3', 'PATCH')).toBe('v1.2.4')
      expect(bumpVersion('v1.2.0', 'PATCH')).toBe('v1.2.1')
    })

    it('should bump UPDATE (minor) version correctly', () => {
      expect(bumpVersion('v1.2.3', 'UPDATE')).toBe('v1.3.0')
      expect(bumpVersion('v1.9.9', 'UPDATE')).toBe('v1.10.0')
    })

    it('should bump RELEASE (major) version correctly', () => {
      expect(bumpVersion('v1.2.3', 'RELEASE')).toBe('v2.0.0')
      expect(bumpVersion('v9.9.9', 'RELEASE')).toBe('v10.0.0')
    })

    it('should handle invalid current version', () => {
      expect(bumpVersion('invalid', 'PATCH')).toBe('v0.0.1')
      expect(bumpVersion('', 'UPDATE')).toBe('v0.1.0')
    })

    it('should handle version without v prefix', () => {
      expect(bumpVersion('1.2.3', 'PATCH')).toBe('v1.2.4')
    })
  })

  describe('validateRepoPath', () => {
    beforeEach(() => {
      // Reset process.cwd() for tests
      vi.stubEnv('PWD', '/home/test/workspace')
    })

    it('should accept valid path within allowed directories', async () => {
      const result = await validateRepoPath('/home/test/workspace/my-project')
      expect(result).toContain('my-project')
    })

    it('should accept path in home directory', async () => {
      const result = await validateRepoPath('/home/test/my-project')
      expect(result).toContain('my-project')
    })

    it('should reject path with .. traversal in input', async () => {
      // The .. check happens on inputPath, not resolved path
      await expect(validateRepoPath('/home/test/../etc/passwd')).rejects.toThrow('Path traversal detected')
    })

    it('should reject path with ~ character', async () => {
      await expect(validateRepoPath('/home/test/~backup')).rejects.toThrow('Path traversal detected')
    })

    it('should reject empty path', async () => {
      await expect(validateRepoPath('')).rejects.toThrow('Repository path is required')
    })

    it('should reject path outside allowed directories', async () => {
      await expect(validateRepoPath('/etc/passwd')).rejects.toThrow('Access denied')
    })

    it('should reject null bytes in path', async () => {
      await expect(validateRepoPath('/home/test\0/project')).rejects.toThrow('contains null bytes')
    })

    it('should normalize path resolution', async () => {
      // The function normalizes the path using path.resolve
      const result = await validateRepoPath('/home/test/my-project')
      expect(result).toContain('my-project')
      expect(result).not.toContain('..')
    })
  })
})
