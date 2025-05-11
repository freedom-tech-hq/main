import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { NotFoundError } from 'freedom-common-errors';
import { makeSyncablePath } from 'freedom-sync-types';
import { isExpectedType } from 'freedom-syncable-store-backing-types';
import type { SyncableStoreBackingItemMetadata } from 'freedom-syncable-store-backing-types';

import { InMemorySyncableStoreBacking } from '../InMemorySyncableStoreBacking.ts';

// Simple trace object for testing
const makeTestTrace = () => ({ id: 'test-trace' });

describe('InMemorySyncableStoreBacking', () => {
  // Scenario 1: Basic File Lifecycle
  it('handles complete file lifecycle operations', async () => {
    // Arrange
    const trace = makeTestTrace();
    const testMetadata: Omit<SyncableStoreBackingItemMetadata, 'name'> = {
      mtime: new Date(),
      size: 0,
      localItemMetadata: {
        lastAccessTime: new Date(),
        hidden: false
      }
    };
    const backing = new InMemorySyncableStoreBacking(testMetadata);

    // Create test path
    const testPath = makeSyncablePath('/test-folder/test-file');

    // Act - Check if path exists initially
    const initialExistsResult = await backing.existsAtPath(trace, testPath);

    // Assert - Should not exist initially
    assert.equal(initialExistsResult.ok, true);
    assert.equal(initialExistsResult.value, false);

    // Act - Create binary file
    const fileMetadata: SyncableStoreBackingItemMetadata = {
      ...testMetadata,
      name: 'test-file'
    };
    const fileContent = new Uint8Array([1, 2, 3, 4, 5]);
    const createResult = await backing.createBinaryFileWithPath(trace, testPath, {
      data: fileContent,
      metadata: fileMetadata
    });

    // Assert - File should be created successfully
    assert.equal(createResult.ok, true);
    assert.equal(createResult.value.type, 'file');

    // Act - Verify path exists now
    const existsResult = await backing.existsAtPath(trace, testPath);

    // Assert - Path should exist
    assert.equal(existsResult.ok, true);
    assert.equal(existsResult.value, true);

    // Act - Retrieve file accessor
    const getResult = await backing.getAtPath(trace, testPath, 'file');

    // Assert - Should retrieve file accessor correctly
    assert.equal(getResult.ok, true);
    assert.equal(getResult.value.type, 'file');

    // Act - Try with wrong type
    const wrongTypeResult = await backing.getAtPath(trace, testPath, 'folder');

    // Assert - Should fail with wrong-type
    assert.equal(wrongTypeResult.ok, false);
    assert.equal(wrongTypeResult.value.errorCode, 'wrong-type');

    // Act - Get metadata
    const metadataResult = await backing.getMetadataAtPath(trace, testPath);

    // Assert - Metadata should match creation metadata
    assert.equal(metadataResult.ok, true);
    assert.equal(metadataResult.value.name, fileMetadata.name);

    // Act - Update local metadata
    const updatedMetadata = {
      lastAccessTime: new Date(),
      hidden: true
    };
    const updateResult = await backing.updateLocalMetadataAtPath(trace, testPath, updatedMetadata);

    // Assert - Update should succeed
    assert.equal(updateResult.ok, true);

    // Act - Get updated metadata
    const updatedMetadataResult = await backing.getMetadataAtPath(trace, testPath);

    // Assert - Should show updated values
    assert.equal(updatedMetadataResult.ok, true);
    assert.equal(updatedMetadataResult.value.localItemMetadata.hidden, true);

    // Act - Delete file
    const deleteResult = await backing.deleteAtPath(trace, testPath);

    // Assert - Delete should succeed
    assert.equal(deleteResult.ok, true);

    // Act - Verify deletion
    const finalExistsResult = await backing.existsAtPath(trace, testPath);

    // Assert - Should not exist after deletion
    assert.equal(finalExistsResult.ok, true);
    assert.equal(finalExistsResult.value, false);
  });
});
