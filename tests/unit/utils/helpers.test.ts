/**
 * Utility Helper Functions Tests
 * Tests for general utility functions used throughout the application
 */

import { describe, it, expect } from 'vitest'
import path from 'path'

describe('Utility Helpers', () => {
  describe('Path helpers', () => {
    function hashForLog(repoPath: string): string {
      const repoName = path.basename(repoPath)
      return repoName.substring(0, 8)
    }

    it('should create short hash from repo path', () => {
      expect(hashForLog('/home/user/my-project')).toBe('my-proje')
      expect(hashForLog('/home/user/project')).toBe('project')
    })

    it('should handle short paths', () => {
      expect(hashForLog('short')).toBe('short')
      expect(hashForLog('abc')).toBe('abc')
    })

    it('should handle empty path', () => {
      expect(hashForLog('')).toBe('')
    })

    it('should handle paths with trailing slash', () => {
      expect(hashForLog('/home/user/my-project/')).toBe('my-proje')
    })

    it('should limit to 8 characters', () => {
      expect(hashForLog('/home/user/very-long-project-name').length).toBeLessThanOrEqual(8)
    })
  })

  describe('String helpers', () => {
    function truncate(str: string, maxLength: number): string {
      if (str.length <= maxLength) return str
      return str.substring(0, maxLength - 3) + '...'
    }

    it('should truncate long strings', () => {
      expect(truncate('Hello World', 8)).toBe('Hello...')
      expect(truncate('Very long string here', 10)).toBe('Very lo...')
    })

    it('should not truncate short strings', () => {
      expect(truncate('Hi', 10)).toBe('Hi')
      expect(truncate('Exact', 5)).toBe('Exact')
    })

    it('should handle empty string', () => {
      expect(truncate('', 10)).toBe('')
    })

    it('should handle very short max length', () => {
      expect(truncate('Hello', 3)).toBe('...')
    })
  })

  describe('Array helpers', () => {
    function chunk<T>(array: T[], size: number): T[][] {
      const chunks: T[][] = []
      for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size))
      }
      return chunks
    }

    function unique<T>(array: T[]): T[] {
      return Array.from(new Set(array))
    }

    it('should chunk arrays correctly', () => {
      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
      expect(chunk([1, 2, 3], 1)).toEqual([[1], [2], [3]])
      expect(chunk([1, 2, 3], 3)).toEqual([[1, 2, 3]])
    })

    it('should handle empty arrays', () => {
      expect(chunk([], 3)).toEqual([])
    })

    it('should handle chunk size larger than array', () => {
      expect(chunk([1, 2], 5)).toEqual([[1, 2]])
    })

    it('should remove duplicates from arrays', () => {
      expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3])
      expect(unique(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c'])
    })

    it('should handle empty array for unique', () => {
      expect(unique([])).toEqual([])
    })

    it('should handle array with no duplicates', () => {
      expect(unique([1, 2, 3])).toEqual([1, 2, 3])
    })
  })

  describe('Object helpers', () => {
    function deepMerge<T>(target: T, source: Partial<T>): T {
      const result = { ...target }
      for (const key in source) {
        const sourceValue = source[key]
        const targetValue = result[key]
        if (
          sourceValue &&
          typeof sourceValue === 'object' &&
          !Array.isArray(sourceValue) &&
          targetValue &&
          typeof targetValue === 'object' &&
          !Array.isArray(targetValue)
        ) {
          result[key] = deepMerge(targetValue, sourceValue)
        } else {
          result[key] = sourceValue as T[Extract<keyof T, string>]
        }
      }
      return result
    }

    it('should merge objects shallowly', () => {
      const target = { a: 1, b: 2 }
      const source = { b: 3, c: 4 }
      expect(deepMerge(target, source)).toEqual({ a: 1, b: 3, c: 4 })
    })

    it('should merge objects deeply', () => {
      const target = { a: { x: 1, y: 2 }, b: 3 }
      const source = { a: { y: 10, z: 20 }, c: 30 }
      expect(deepMerge(target, source)).toEqual({
        a: { x: 1, y: 10, z: 20 },
        b: 3,
        c: 30,
      })
    })

    it('should not mutate original object', () => {
      const target = { a: 1, b: 2 }
      const source = { b: 3 }
      const result = deepMerge(target, source)
      expect(target).toEqual({ a: 1, b: 2 })
      expect(result).toEqual({ a: 1, b: 3 })
    })

    it('should handle empty source', () => {
      const target = { a: 1, b: 2 }
      expect(deepMerge(target, {})).toEqual({ a: 1, b: 2 })
    })
  })

  describe('Validation helpers', () => {
    function isNonEmptyString(value: unknown): value is string {
      return typeof value === 'string' && value.trim().length > 0
    }

    function isPositiveInteger(value: unknown): value is number {
      return typeof value === 'number' && Number.isInteger(value) && value > 0
    }

    it('should validate non-empty strings', () => {
      expect(isNonEmptyString('hello')).toBe(true)
      expect(isNonEmptyString('  hello  ')).toBe(true)
      expect(isNonEmptyString('')).toBe(false)
      expect(isNonEmptyString('   ')).toBe(false)
      expect(isNonEmptyString(null)).toBe(false)
      expect(isNonEmptyString(undefined)).toBe(false)
      expect(isNonEmptyString(123)).toBe(false)
    })

    it('should validate positive integers', () => {
      expect(isPositiveInteger(1)).toBe(true)
      expect(isPositiveInteger(100)).toBe(true)
      expect(isPositiveInteger(0)).toBe(false)
      expect(isPositiveInteger(-1)).toBe(false)
      expect(isPositiveInteger(1.5)).toBe(false)
      expect(isPositiveInteger(NaN)).toBe(false)
      expect(isPositiveInteger(Infinity)).toBe(false)
      expect(isPositiveInteger(null)).toBe(false)
      expect(isPositiveInteger(undefined)).toBe(false)
    })
  })

  describe('Promise helpers', () => {
    async function delay(ms: number): Promise<void> {
      return new Promise((resolve) => setTimeout(resolve, ms))
    }

    async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage = 'Operation timed out'): Promise<T> {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
      })
      return Promise.race([promise, timeoutPromise])
    }

    it('should delay execution', async () => {
      const start = Date.now()
      await delay(100)
      const elapsed = Date.now() - start
      expect(elapsed).toBeGreaterThanOrEqual(100)
    })

    it('should timeout slow promises', async () => {
      const slowPromise = delay(1000)
      await expect(withTimeout(slowPromise, 100)).rejects.toThrow('Operation timed out')
    })

    it('should not timeout fast promises', async () => {
      const fastPromise = Promise.resolve('success')
      const result = await withTimeout(fastPromise, 100)
      expect(result).toBe('success')
    })
  })

  describe('Retry helpers', () => {
    async function retry<T>(
      fn: () => Promise<T>,
      maxRetries = 3,
      delayMs = 100
    ): Promise<T> {
      let lastError: Error | null = null
      for (let i = 0; i < maxRetries; i++) {
        try {
          return await fn()
        } catch (error) {
          lastError = error as Error
          if (i < maxRetries - 1) {
            await new Promise((resolve) => setTimeout(resolve, delayMs))
          }
        }
      }
      throw lastError
    }

    it('should retry failed operations', async () => {
      let attempts = 0
      const flakyFn = async () => {
        attempts++
        if (attempts < 3) throw new Error('Failed')
        return 'success'
      }
      const result = await retry(flakyFn, 3, 10)
      expect(result).toBe('success')
      expect(attempts).toBe(3)
    })

    it('should throw after max retries', async () => {
      const failingFn = async () => {
        throw new Error('Always fails')
      }
      await expect(retry(failingFn, 3, 10)).rejects.toThrow('Always fails')
    })

    it('should succeed on first try', async () => {
      const successFn = async () => 'success'
      const result = await retry(successFn, 3, 10)
      expect(result).toBe('success')
    })
  })
})
