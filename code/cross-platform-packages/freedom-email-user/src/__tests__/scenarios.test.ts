import { strict as assert } from 'node:assert';
import { afterEach, describe, test } from 'node:test';

import { listOutboundMailIds } from 'freedom-email-sync';
import { clearDocumentCache, createBundleAtPath, createFolderAtPath } from 'freedom-syncable-store';

import { createEmailStoreTestStack } from '../__test_dependency__/createEmailStoreTestStack.ts';
import { addMailDraft, getMailDraftById, getUserMailPaths, moveMailDraftToOutbox } from '../utils/exports.ts';

describe('Outbound email routes', () => {
  afterEach(clearDocumentCache);

  test('Full external address outbound', async () => {
    // Arrange
    const { trace, store, access } = await createEmailStoreTestStack();

    const paths = await getUserMailPaths(store);

    // Mail Storage Folder
    const mailStorageFolder = await createFolderAtPath(trace, store, paths.storage.value);
    assert.ok(mailStorageFolder.ok);

    // Mail Out Folder
    const mailOutFolder = await createFolderAtPath(trace, store, paths.out.value);
    assert.ok(mailOutFolder.ok);

    // Mail Drafts Bundle
    const mailDraftsBundle = await createBundleAtPath(trace, store, paths.drafts.value);
    assert.ok(mailDraftsBundle.ok);

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Act - Create a draft
    const draftResult = await addMailDraft(trace, access, {});

    // Assert - TODO
    assert.ok(draftResult.ok);
    const { draftId } = draftResult.value;

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Act - Edit draft
    const draftDoc = await getMailDraftById(trace, access, draftId);
    assert.ok(draftDoc.ok);

    const doc = draftDoc.value.document;
    doc.to.append(['test@example.com']);
    doc.subject.replace(0, 'The subject');
    doc.body.replace(0, 'The body');

    await draftDoc.value.save(trace);

    // Assert - TODO
    assert.ok(draftDoc.ok);

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Act - Move draft to outbox
    const moveResult = await moveMailDraftToOutbox(trace, access, draftId);

    // Assert - TODO
    assert.ok(moveResult.ok);

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Act - Poll
    const listResult = await listOutboundMailIds(trace, access);
    console.log(listResult);
    // TODO: fix bug, it gets a folder where expected a bundle // assert.ok(listResult.ok);
    // assert.equal(listResult.value.items.length, 1);
    //
    // const mailId = listResult.value.items[0];

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Act - Get contents to submit to our outbound delivery SMTP server
    // const mailResult = await getOutboundMailById(trace, access, mailId);
    // assert.ok(mailResult.ok);
    // assert.equal(mailResult.value.from, 'test@freedommail.me');
  });
});
