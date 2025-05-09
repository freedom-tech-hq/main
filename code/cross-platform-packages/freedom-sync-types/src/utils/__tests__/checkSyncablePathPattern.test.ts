import { describe, it } from 'node:test';

import type { Result } from 'freedom-async';
import { makeTrace } from 'freedom-contexts';
import { expectOk, expectStrictEqual } from 'freedom-testing-tools';

import type { SyncableId } from '../../types/SyncableId.ts';
import { plainId } from '../../types/SyncableId.ts';
import { SyncablePathPattern } from '../../types/SyncablePathPattern.ts';
import { checkSyncablePathPattern } from '../checkSyncablePathPattern.ts';
import type { CheckSyncablePathPatternsResult } from '../checkSyncablePathPatterns.ts';

const trace = makeTrace('test');

// Helper function to run checkSyncablePathPattern and extract the result value
const testMatch = (relativeIds: SyncableId[], pattern: SyncablePathPattern): CheckSyncablePathPatternsResult => {
  const result: Result<CheckSyncablePathPatternsResult> = checkSyncablePathPattern(trace, relativeIds, pattern);
  expectOk(result);

  return result.value;
};

describe('checkSyncablePathPattern', () => {
  describe('positive matching (definite results)', () => {
    it('should match empty pattern with empty path', () => {
      const emptyPath: SyncableId[] = [];
      const emptyPattern = new SyncablePathPattern();

      expectStrictEqual(testMatch(emptyPath, emptyPattern), 'definite');
    });

    it('should match exact paths', () => {
      const path = [plainId('file', 'a'), plainId('file', 'b'), plainId('file', 'c')];
      const pattern = new SyncablePathPattern(plainId('file', 'a'), plainId('file', 'b'), plainId('file', 'c'));

      expectStrictEqual(testMatch(path, pattern), 'definite');
    });

    it('should match paths with single wildcards (*)', () => {
      const path = [plainId('file', 'a'), plainId('file', 'b'), plainId('file', 'c')];
      const pattern = new SyncablePathPattern('*', plainId('file', 'b'), '*');

      expectStrictEqual(testMatch(path, pattern), 'definite');
    });

    it('should match any path with double-wildcard (**) pattern', () => {
      const path = [plainId('file', 'a'), plainId('file', 'b'), plainId('file', 'c')];
      const pattern = new SyncablePathPattern('**');

      expectStrictEqual(testMatch(path, pattern), 'definite');
    });

    it('should match path with double-wildcard (**) in the middle', () => {
      const path = [plainId('file', 'a'), plainId('file', 'b'), plainId('file', 'c'), plainId('file', 'd')];
      const pattern = new SyncablePathPattern(plainId('file', 'a'), '**', plainId('file', 'd'));

      expectStrictEqual(testMatch(path, pattern), 'definite');
    });

    it('should match path with double-wildcard (**) at the beginning', () => {
      const path = [plainId('file', 'a'), plainId('file', 'b'), plainId('file', 'c')];
      const pattern = new SyncablePathPattern('**', plainId('file', 'c'));

      expectStrictEqual(testMatch(path, pattern), 'definite');
    });

    it('should match path with double-wildcard (**) at the end', () => {
      const path = [plainId('file', 'a'), plainId('file', 'b'), plainId('file', 'c')];
      const pattern = new SyncablePathPattern(plainId('file', 'a'), '**');

      expectStrictEqual(testMatch(path, pattern), 'definite');
    });

    it('should match with multiple wildcards', () => {
      const path = [plainId('folder', 'root'), plainId('folder', 'subdir'), plainId('file', 'document')];
      const pattern = new SyncablePathPattern('*', '**', '*');

      expectStrictEqual(testMatch(path, pattern), 'definite');
    });
  });

  describe('negative matching - impossible results', () => {
    it('should return impossible for non-empty path with empty pattern', () => {
      const path = [plainId('file', 'document')];
      const pattern = new SyncablePathPattern();

      expectStrictEqual(testMatch(path, pattern), 'impossible');
    });

    it('should return impossible when path elements do not match pattern', () => {
      const path = [plainId('file', 'a'), plainId('file', 'x'), plainId('file', 'c')];
      const pattern = new SyncablePathPattern(plainId('file', 'a'), plainId('file', 'b'), plainId('file', 'c'));

      expectStrictEqual(testMatch(path, pattern), 'impossible');
    });

    it('should return impossible when path does not match the beginning of the specified pattern, even if it contains a ** wildcard', () => {
      const path = [plainId('file', 'a'), plainId('file', 'b')];
      const pattern = new SyncablePathPattern(plainId('file', 'x'), '**');

      expectStrictEqual(testMatch(path, pattern), 'impossible');
    });
  });

  describe('negative matching - possible results', () => {
    it('should return possible when path is empty and pattern requires elements', () => {
      const path: SyncableId[] = [];
      const pattern = new SyncablePathPattern(plainId('file', 'a'));

      expectStrictEqual(testMatch(path, pattern), 'possible');
    });

    it('should return possible when the provided path matches the the start of the specified pattern', () => {
      const path = [plainId('file', 'a'), plainId('file', 'b')];
      const pattern = new SyncablePathPattern(plainId('file', 'a'), plainId('file', 'b'), plainId('file', 'c'));

      expectStrictEqual(testMatch(path, pattern), 'possible');
    });

    it('should return possible when pattern is longer than path but starts with matching elements and has **', () => {
      const path = [plainId('file', 'a')];
      const pattern = new SyncablePathPattern(plainId('file', 'a'), '**', plainId('file', 'c'));

      expectStrictEqual(testMatch(path, pattern), 'possible');
    });

    it('should return possible when empty path with pattern containing **', () => {
      const path: SyncableId[] = [];
      const pattern = new SyncablePathPattern('**', plainId('file', 'a'));

      expectStrictEqual(testMatch(path, pattern), 'possible');
    });

    it('should return possible when non-matching path with pattern containing ** in the middle', () => {
      const path = [plainId('file', 'a'), plainId('file', 'b'), plainId('file', 'c')];
      const pattern = new SyncablePathPattern(plainId('file', 'a'), '**', plainId('file', 'x'));

      expectStrictEqual(testMatch(path, pattern), 'possible');
    });

    it('should handle * at boundary conditions correctly', () => {
      // * should match exactly one element, not zero
      const path = [plainId('file', 'a'), plainId('file', 'c')];
      const pattern = new SyncablePathPattern(plainId('file', 'a'), '*', plainId('file', 'c'));

      expectStrictEqual(testMatch(path, pattern), 'possible');
    });
  });

  describe('edge cases', () => {
    it('should handle consecutive ** wildcards correctly', () => {
      const path = [plainId('file', 'a'), plainId('file', 'b'), plainId('file', 'c')];
      const pattern = new SyncablePathPattern('**', '**', plainId('file', 'c'));

      expectStrictEqual(testMatch(path, pattern), 'definite');
    });

    it('should match when ** followed by single * wildcard', () => {
      const path = [plainId('file', 'a'), plainId('file', 'b'), plainId('file', 'c')];
      const pattern = new SyncablePathPattern('**', '*', plainId('file', 'c'));

      expectStrictEqual(testMatch(path, pattern), 'definite');
    });

    it('should handle ** matching zero elements', () => {
      const path = [plainId('file', 'a'), plainId('file', 'c')];
      const pattern = new SyncablePathPattern(plainId('file', 'a'), '**', plainId('file', 'c'));

      expectStrictEqual(testMatch(path, pattern), 'definite');
    });

    it('should handle complex path with multiple wildcards correctly', () => {
      const path = [plainId('folder', 'root'), plainId('folder', 'level1'), plainId('folder', 'level2'), plainId('file', 'document')];
      const pattern = new SyncablePathPattern('*', '**', '*', plainId('file', 'document'));

      expectStrictEqual(testMatch(path, pattern), 'definite');
    });

    it('should return possible with multiple ** wildcards in pattern', () => {
      const path = [plainId('file', 'a')];
      const pattern = new SyncablePathPattern('**', plainId('file', 'b'), '**', plainId('file', 'c'));

      expectStrictEqual(testMatch(path, pattern), 'possible');
    });
  });
});
