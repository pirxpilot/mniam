const { describe, after, it } = require('node:test');
const assert = require('node:assert/strict');

const database = require('../lib/database');

describe('aggregate', async function () {
  const db = database('mongodb://localhost/mniam-test');
  const collection = db.collection({ name: 'books' });
  await db.drop();

  after(async function () {
    await db.drop();
    await db.close();
  });

  it('should process pipeline', async function () {
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

  async function closeCollection() {
    await collection.close();
  }
});
