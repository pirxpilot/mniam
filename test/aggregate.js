const test = require(`tape`);

const database = require('../lib/database');

test('aggregate', function(t) {

  const db = database('mongodb://localhost/mniam-test');
  const collection = db.collection({ name: 'books' });

  t.test('before', dropDatabase);

  t.test('beforeEach', createCollection);

  t.test('should process pipeline', function(t) {
    t.plan(2);

    collection
      .aggregate()
      .project({ author: 1, tags: 1 })
      .unwind('$tags')
      .group({
        _id : { tags : '$tags' },
        authors : { $addToSet : '$author' },
        count: { $sum: 1 }
      })
      .sort({ count: -1 })
      .toArray(function(err, results) {
        t.error(err);
        t.deepEqual(results, [
          { _id: { 'tags': 'fun' }, 'authors': [ 'bob' ], count: 2 },
          { _id: { 'tags': 'good' }, 'authors': [ 'bob' ], count: 1 }
        ]);
      });
  });

  t.test('afterEach', closeCollection);

  t.test('after', dropDatabase);

  t.end();

  function dropDatabase(t) {
    db.drop(() => { db.close(); t.end(); });
  }

  function createCollection(t) {
    collection.insertOne({
      title : 'this is my title',
      author : 'bob',
      pageViews : 5,
      tags : [ 'fun' , 'good' , 'fun' ],
      other : { foo : 5 },
    }, t.end);
  }

  function closeCollection(t) {
    collection.close();
    t.end();
  }
});


