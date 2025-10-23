import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';
import database from '../lib/database.js';

describe('aggregate', async () => {
  const db = database('mongodb://localhost/mniam-test');
  const collection = db.collection({ name: 'books' });
  await db.drop();

  after(async () => {
    await db.drop();
    await db.close();
  });

  it('should process pipeline', async () => {
    after(closeCollection);

    await createCollection();

    const results = await collection
      .aggregate()
      .project({ author: 1, tags: 1 })
      .unwind('$tags')
      .group({
        _id: { tags: '$tags' },
        authors: { $addToSet: '$author' },
        count: { $sum: 1 }
      })
      .sort({ count: -1 })
      .toArray();

    assert.deepEqual(results, [
      { _id: { tags: 'fun' }, authors: ['bob'], count: 2 },
      { _id: { tags: 'good' }, authors: ['bob'], count: 1 }
    ]);
  });

  async function createCollection() {
    await collection.insertOne({
      title: 'this is my title',
      author: 'bob',
      pageViews: 5,
      tags: ['fun', 'good', 'fun'],
      other: { foo: 5 }
    });
  }

  function closeCollection() {
    collection.close();
  }
});
