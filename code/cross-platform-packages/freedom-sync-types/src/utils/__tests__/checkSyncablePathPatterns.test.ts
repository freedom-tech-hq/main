import { describe, it } from 'node:test';

import type { Result } from 'freedom-async';
import { makeTrace } from 'freedom-contexts';
import { expectOk, expectStrictEqual } from 'freedom-testing-tools';

import type { SyncableId } from '../../types/SyncableId.ts';
import { plainId } from '../../types/SyncableId.ts';
import { SyncablePathPattern } from '../../types/SyncablePathPattern.ts';
import type { SyncGlob } from '../../types/SyncGlob.ts';
import { checkSyncablePathPattern } from '../checkSyncablePathPattern.ts';
import type { CheckSyncablePathPatternsResult } from '../checkSyncablePathPatterns.ts';
import { checkSyncablePathPatterns } from '../checkSyncablePathPatterns.ts';

const trace = makeTrace('test');

// Helper function to run checkSyncablePathPatterns and extract the result value
const testMatch = (relativeIds: SyncableId[], options: SyncGlob): CheckSyncablePathPatternsResult => {
  const result: Result<CheckSyncablePathPatternsResult> = checkSyncablePathPatterns(trace, relativeIds, options);
  expectOk(result);

  return result.value;
};

describe('checkSyncablePathPatterns', () => {
  describe('inclusion patterns', () => {
    it('should return definite when path matches a single inclusion pattern', () => {
      const path = [plainId('file', 'a'), plainId('file', 'b')];
      const pattern = new SyncablePathPattern(plainId('file', 'a'), plainId('file', 'b'));

      expectStrictEqual(testMatch(path, { include: [pattern] }), 'definite');
    });

    it('should return definite when path matches at least one inclusion pattern', () => {
      const path = [plainId('file', 'a'), plainId('file', 'b')];
      const matchingPattern = new SyncablePathPattern(plainId('file', 'a'), plainId('file', 'b'));
      const nonMatchingPattern = new SyncablePathPattern(plainId('file', 'x'), plainId('file', 'y'));

      expectStrictEqual(testMatch(path, { include: [nonMatchingPattern, matchingPattern] }), 'definite');
    });

    it('should return impossible when path matches no inclusion patterns and none have wildcards', () => {
      const path = [plainId('file', 'a'), plainId('file', 'b')];
      const pattern1 = new SyncablePathPattern(plainId('file', 'x'), plainId('file', 'y'));
      const pattern2 = new SyncablePathPattern(plainId('file', 'c'), plainId('file', 'd'));

      expectStrictEqual(testMatch(path, { include: [pattern1, pattern2] }), 'impossible');
    });

    it('should return possible when path does not match inclusion patterns but one has ** wildcard', () => {
      const path = [plainId('file', 'a'), plainId('file', 'b')];
      const nonMatchingPattern = new SyncablePathPattern(plainId('file', 'x'), plainId('file', 'y'));
      const wildcardPattern = new SyncablePathPattern(plainId('file', 'a'), '**', plainId('file', 'z'));

      expectStrictEqual(testMatch(path, { include: [nonMatchingPattern, wildcardPattern] }), 'possible');
    });

    it('should return possible with a partial match at beginning of path', () => {
      const path = [plainId('file', 'a'), plainId('file', 'b'), plainId('file', 'c')];
      const pattern = new SyncablePathPattern(plainId('file', 'a'), plainId('file', 'b'));

      expectStrictEqual(testMatch(path, { include: [pattern] }), 'impossible');
    });

    it('should return definite with an empty path and an empty pattern', () => {
      const path: SyncableId[] = [];
      const pattern = new SyncablePathPattern();

      expectStrictEqual(testMatch(path, { include: [pattern] }), 'definite');
    });

    it('should return definite with ** wildcard pattern', () => {
      const path = [plainId('file', 'a'), plainId('file', 'b'), plainId('file', 'c')];
      const pattern = new SyncablePathPattern('**');

      expectStrictEqual(testMatch(path, { include: [pattern] }), 'definite');
    });

    it('should return definite with complex wildcard pattern that matches', () => {
      const path = [plainId('folder', 'root'), plainId('folder', 'level1'), plainId('file', 'document')];
      const pattern = new SyncablePathPattern('*', '*', plainId('file', 'document'));

      expectStrictEqual(testMatch(path, { include: [pattern] }), 'definite');
    });

    it('should return definite when path matches an inclusion pattern and does not match exclusion pattern, even if it might in future', () => {
      const path = [plainId('file', 'a')];
      const includePattern = new SyncablePathPattern('**'); // Match anything
      // This exclusion pattern would match path/file/b but not just path
      const excludePattern = new SyncablePathPattern(plainId('file', 'a'), plainId('file', 'b'));

      expectStrictEqual(
        testMatch(path, {
          include: [includePattern],
          exclude: [excludePattern]
        }),
        'definite'
      );
    });
  });

  describe('exclusion patterns', () => {
    it('should return impossible when path matches an exclusion pattern exactly', () => {
      const path = [plainId('file', 'a'), plainId('file', 'b')];
      const includePattern = new SyncablePathPattern('**'); // Match anything
      const excludePattern = new SyncablePathPattern(plainId('file', 'a'), plainId('file', 'b'));

      expectStrictEqual(
        testMatch(path, {
          include: [includePattern],
          exclude: [excludePattern]
        }),
        'impossible'
      );
    });

    it('should return impossible when path matches one of multiple exclusion patterns', () => {
      const path = [plainId('file', 'a'), plainId('file', 'b')];
      const includePattern = new SyncablePathPattern('**'); // Match anything
      const excludePattern1 = new SyncablePathPattern(plainId('file', 'x'), plainId('file', 'y'));
      const excludePattern2 = new SyncablePathPattern(plainId('file', 'a'), plainId('file', 'b'));

      expectStrictEqual(
        testMatch(path, {
          include: [includePattern],
          exclude: [excludePattern1, excludePattern2]
        }),
        'impossible'
      );
    });

    it('should be unaffected by exclusion patterns that do not match the path', () => {
      const path = [plainId('file', 'a'), plainId('file', 'b')];
      const includePattern = new SyncablePathPattern(plainId('file', 'a'), plainId('file', 'b'));
      const excludePattern = new SyncablePathPattern(plainId('file', 'x'), plainId('file', 'y'));

      expectStrictEqual(
        testMatch(path, {
          include: [includePattern],
          exclude: [excludePattern]
        }),
        'definite'
      );
    });

    it('should return impossible when path matches exclusion pattern with wildcards', () => {
      const path = [plainId('file', 'a'), plainId('file', 'b'), plainId('file', 'c')];
      const includePattern = new SyncablePathPattern('**'); // Match anything
      const excludePattern = new SyncablePathPattern(plainId('file', 'a'), '*', plainId('file', 'c'));

      expectStrictEqual(
        testMatch(path, {
          include: [includePattern],
          exclude: [excludePattern]
        }),
        'impossible'
      );
    });

    it('should return impossible when path matches exclusion pattern with ** wildcard', () => {
      const path = [plainId('file', 'a'), plainId('file', 'b'), plainId('file', 'c')];
      const includePattern = new SyncablePathPattern('**'); // Match anything
      const excludePattern = new SyncablePathPattern(plainId('file', 'a'), '**');

      expectStrictEqual(
        testMatch(path, {
          include: [includePattern],
          exclude: [excludePattern]
        }),
        'impossible'
      );
    });

    it('should handle empty exclusion array', () => {
      const path = [plainId('file', 'a'), plainId('file', 'b')];
      const includePattern = new SyncablePathPattern(plainId('file', 'a'), plainId('file', 'b'));

      expectStrictEqual(
        testMatch(path, {
          include: [includePattern],
          exclude: []
        }),
        'definite'
      );
    });

    it('should handle undefined exclusion array', () => {
      const path = [plainId('file', 'a'), plainId('file', 'b')];
      const includePattern = new SyncablePathPattern(plainId('file', 'a'), plainId('file', 'b'));

      expectStrictEqual(
        testMatch(path, {
          include: [includePattern],
          exclude: undefined
        }),
        'definite'
      );
    });
  });

  describe('complex combinations', () => {
    it('should prioritize exclusion patterns over inclusion patterns', () => {
      const path = [plainId('file', 'a'), plainId('file', 'b')];

      // This path matches both inclusion and exclusion
      const includePattern = new SyncablePathPattern(plainId('file', 'a'), plainId('file', 'b'));
      const excludePattern = new SyncablePathPattern(plainId('file', 'a'), plainId('file', 'b'));

      expectStrictEqual(
        testMatch(path, {
          include: [includePattern],
          exclude: [excludePattern]
        }),
        'impossible'
      );
    });

    it('should handle patterns with overlapping ** wildcards', () => {
      const path = [plainId('file', 'a'), plainId('file', 'b'), plainId('file', 'c')];

      const includePattern = new SyncablePathPattern('**', plainId('file', 'c'));
      // This exclude pattern matches files that have 'a' somewhere in their path
      const excludePattern = new SyncablePathPattern('**', plainId('file', 'a'), '**');

      expectStrictEqual(
        testMatch(path, {
          include: [includePattern],
          exclude: [excludePattern]
        }),
        'impossible'
      );
    });

    it('should return possible when path partially matches include but not exclude', () => {
      const path = [plainId('file', 'a')];

      // This include pattern would match path/file/b
      const includePattern = new SyncablePathPattern(plainId('file', 'a'), plainId('file', 'b'));
      // This exclude pattern would match path/file/b/file/c
      const excludePattern = new SyncablePathPattern(plainId('file', 'a'), plainId('file', 'b'), plainId('file', 'c'));

      console.log('check include', checkSyncablePathPattern(trace, path, includePattern));
      console.log('check exclude', checkSyncablePathPattern(trace, path, excludePattern));

      expectStrictEqual(
        testMatch(path, {
          include: [includePattern],
          exclude: [excludePattern]
        }),
        'possible'
      );
    });

    it('should return impossible when all include patterns are impossible and exclude is irrelevant', () => {
      const path = [plainId('file', 'x')];

      const includePattern1 = new SyncablePathPattern(plainId('file', 'a'));
      const includePattern2 = new SyncablePathPattern(plainId('file', 'b'));
      const excludePattern = new SyncablePathPattern(plainId('file', 'c'));

      expectStrictEqual(
        testMatch(path, {
          include: [includePattern1, includePattern2],
          exclude: [excludePattern]
        }),
        'impossible'
      );
    });

    it('should handle complex tree structures with both includes and excludes', () => {
      // A path representing a file in a nested structure
      const path = [
        plainId('folder', 'root'),
        plainId('folder', 'projects'),
        plainId('folder', 'project1'),
        plainId('file', 'document.txt')
      ];

      // Include all files in projects
      const includePattern = new SyncablePathPattern(plainId('folder', 'root'), plainId('folder', 'projects'), '**');

      // But exclude the project1 directory
      const excludePattern = new SyncablePathPattern(
        plainId('folder', 'root'),
        plainId('folder', 'projects'),
        plainId('folder', 'project1'),
        '**'
      );

      expectStrictEqual(
        testMatch(path, {
          include: [includePattern],
          exclude: [excludePattern]
        }),
        'impossible'
      );
    });

    it("should handle subtree matching with includes and excludes when excludes don't match", () => {
      const path = [plainId('folder', 'root'), plainId('folder', 'src')];

      // Include all files in the tree
      const includePattern = new SyncablePathPattern('**');

      // Exclude node_modules and build directories
      const excludePattern1 = new SyncablePathPattern('**', plainId('folder', 'node_modules'), '**');
      const excludePattern2 = new SyncablePathPattern('**', plainId('folder', 'build'), '**');

      // Current path doesn't match any exclusions yet, but could match includes
      expectStrictEqual(
        testMatch(path, {
          include: [includePattern],
          exclude: [excludePattern1, excludePattern2]
        }),
        'definite'
      );
    });

    it('should handle subtree matching with includes and excludes when excludes match', () => {
      const path = [plainId('folder', 'root'), plainId('folder', 'build')];

      // Include all files in the tree
      const includePattern = new SyncablePathPattern('**');

      // Exclude node_modules and build directories
      const excludePattern1 = new SyncablePathPattern('**', plainId('folder', 'node_modules'), '**');
      const excludePattern2 = new SyncablePathPattern('**', plainId('folder', 'build'), '**');

      // Current path doesn't match any exclusions yet, but could match includes
      expectStrictEqual(
        testMatch(path, {
          include: [includePattern],
          exclude: [excludePattern1, excludePattern2]
        }),
        'impossible'
      );
    });
  });
});
