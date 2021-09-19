const test = require('tape');

const async = require('async');
const database = require('../lib/database');

const db = database('mongodb://localhost/mniam-test');

test('before', dropDatabase);

test('collection', function(t) {
  const friends = db.collection({
    name: 'friends',
    indexes: [[{ name: 1 }]]
  });

  t.test('supports crud methods', function(t) {
    friends.insertOne({
      name: 'Alice',
      age: 14,
    }, function(err, item) {
      t.error(err);
      t.ok(item);
      t.equal(item.name, 'Alice');
      t.equal(item.age, 14);
      t.ok(item._id);

      friends.findOneAndUpdate({ _id: item._id }, {
        $set: { age: 15 },
      }, { returnDocument: 'after' }, function(err, item) {
        t.error(err);
        t.ok(item);
        t.equal(item.name, 'Alice');
        t.equal(item.age, 15);

        friends.deleteOne({ name: 'Alice' }, t.end);
      });
    });
  });

  t.test('after', function(t) {
    closeCollection(friends, t);
  });

  t.end();
});

test('collection', function(t) {
  const friends = db.collection({
    name: 'friends',
    indexes: [[{ name: 1 }]]
  });

  t.test('supports findOneAndReplace', function(t) {
    async.waterfall([
      fn => friends.insertOne({ name: 'Alice', age: 14 }, fn),
      (item, fn) => friends.findOneAndReplace({ name: 'Alice'}, { name: 'Bob', age: 33 }, fn),
      (item, fn) => {
        t.equal(item.name, 'Alice');
        t.equal(item.age, 14);
        fn();
      },
      fn => friends.findOne({ name: 'Bob'}, fn),
      (item, fn) => {
        t.equal(item.name, 'Bob');
        t.equal(item.age, 33);
        fn();
      }
    ], t.end);
  });

  t.test('after', function(t) {
    closeCollection(friends, t);
  });

  t.end();
});

test('collection', function(t) {
  const friends = db.collection({
    name: 'friends',
    indexes: [[{ name: 1 }]]
  });

  t.test('supports findOneAndReplace with options', function(t) {
    async.waterfall([
      fn => friends.insertOne({ name: 'Alice', age: 14 }, fn),
      (item, fn) => friends.findOneAndReplace(
        { name: 'Alice'},
        { name: 'Bob', age: 33 },
        { returnDocument: 'after' },
        fn
      ),
      (item, fn) => {
        t.equal(item.name, 'Bob');
        t.equal(item.age, 33);
        fn();
      },
    ], t.end);
  });


  t.test('after', function(t) {
    closeCollection(friends, t);
  });

  t.end();
});

test('collection', function(t) {
  const friends = db.collection({
    name: 'friends',
    indexes: [[{ name: 1 }]]
  });

  t.test('supports findOneAndDelete', function(t) {
    async.waterfall([
      fn => friends.insertOne({ name: 'Alice', age: 14 }, fn),
      (item, fn) => friends.findOneAndDelete({ name: 'Alice'}, fn),
      (item, fn) => {
        t.equal(item.name, 'Alice');
        t.equal(item.age, 14);
        fn();
      },
      fn => friends.findOne({ name: 'Alice'}, err => {
        t.ok(err, 'not finding the element should produce an error');
        fn();
      })
    ], t.end);
  });


  t.test('after', function(t) {
    closeCollection(friends, t);
  });

  t.end();
});


test('collection', function(t) {
  const friends = db.collection({
    name: 'friends',
    indexes: [[{ name: 1 }]]
  });

  t.test('findOneAndUpdate accepts query as argument', function(t) {

    async.waterfall([
      function(fn) {
        friends.insertOne({name: 'Bob', age: 33 }, fn);
      },
      function(item, fn) {
        friends.findOneAndUpdate({ name: 'Bob' }, { $set: {age: 34 } }, fn);
      },
      function(item, fn) {
        t.equal(item.name, 'Bob');
        t.equal(item.age, 34);
        t.ok(item._id);

        fn();
      }
    ], t.end);
  });

  t.test('after', function(t) {
    closeCollection(friends, t);
  });

  t.end();
});

test('collection', function(t) {
  const values = db.collection({
    name: 'values'
  });

  t.test('drop removes all items from collection', function(t) {
    async.series([
      function(fn) {
        async.times(10, function(i, fn) {
          values.insertOne({ value: `x${i}` }, fn);
        }, fn);
      },
      function(fn) {
        values.find({}, {}, {}, function(err, items) {
          t.equal(items.length, 10);
          fn(err);
        });
      },
      function(fn) {
        values.drop(fn);
      },
      function(fn) {
        values.find({}, {}, {}, function(err, items) {
          t.equal(items.length, 0);

          fn(err);
        });
      }
    ], t.end);
  });


  t.test('after', function(t) {
    closeCollection(values, t);
  });

  t.end();
});


test('should insert', function(t) {

  let friends;

  function cleanup(t) {
    friends.removeMany({}, t.end);
  }

  t.test('before', function(t) {
    friends = db.collection({
      name: 'friends',
      indexes: [[{ name: 1 }]]
    });
    t.end();
  });

  t.test('afterEach', cleanup);

  t.test('one', function(t) {
    async.waterfall([
      function(fn) {
        friends.insertOne({name: 'Bob', age: 34 }, fn);
      },
      function(item, fn) {
        friends.query({ name: 'Bob' }).toArray(fn);
      },
      function(items, fn) {
        t.equal(items.length, 1);
        let item = items[0];
        t.equal(item.name, 'Bob');
        t.equal(item.age, 34);
        t.ok(item._id);

        friends.close();
        fn();
      }
    ], t.end);
  });

  t.test('afterEach', cleanup);

  t.test('many', function(t) {
    async.waterfall([
      function(fn) {
        friends.insertMany([
          {name: 'Bob', age: 33 },
          {name: 'Alice', age: 20 },
          {name: 'Cyril', age: 21 }
        ], fn);
      },
      function(item, fn) {
        t.deepEquals(Object.keys(item).length, 3);
        friends.query({ name: 'Bob' }).toArray(fn);
      },
      function(items, fn) {
        t.equal(items.length, 1);
        let item = items[0];
        t.equal(item.name, 'Bob');
        t.equal(item.age, 33);
        t.ok(item._id);
        fn();
      },
      function(fn) {
        friends.query({ name: 'Alice' }).toArray(fn);
      },
      function(items, fn) {
        t.equal(items.length, 1);
        let item = items[0];
        t.equal(item.name, 'Alice');
        t.equal(item.age, 20);
        t.ok(item._id);
        fn();
      }
    ], t.end);
  });

  t.test('afterEach', cleanup);

  t.test('after', function(t) {
    friends.drop(() => {
      friends.close();
      t.end();
    });
  });

  t.end();
});

test('after', dropDatabase);

function dropDatabase(t) {
  db.drop(() => { db.close(); t.end(); });
}

function closeCollection(collection, t) {
  collection.close();
  t.end();
}
