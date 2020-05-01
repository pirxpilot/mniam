const test = require('tape');

const async = require('async');
const database = require('../lib/database');

const db = database('mongodb://localhost/mniam-test');

test('before', dropDatabase);

test('query', function(t) {
  const TEST_LEN = 421;

  const  numbers = db.collection({
    name: 'numbers',
    batchSize: 33
  });

  t.test('beforeEach', insert);

  t.test('eachLimit iterates over all elements of collection', function(t) {
    const results = [];

    function receive(item, fn) {
      results[item.value] = true;
      async.setImmediate(fn);
    }

    numbers.eachLimit(7, receive, function(err) {
      t.error(err);

      t.equal(results.length, TEST_LEN, 'need all items received');
      t.equal(results.filter(Boolean).length, TEST_LEN, 'and they all need to be true');

      t.end();
    });
  });

  t.test('afterEach', remove);

  t.test('beforeEach', insert);

  t.test('find elements by query', function(t) {
    const results = [];

    function receive(item, fn) {
      results.push({ value: item.value });
      async.setImmediate(fn);
    }

    numbers
    .query({ value: 10 })
    .eachSeries(receive, function(err) {
      t.error(err);

      t.equal(results.length, 1, 'only one element is found');
      t.deepEqual(results[0], { value: 10 }, 'and its value is what we were looking for');

      t.end();
    });
  });

  t.test('afterEach', remove);

  t.test('beforeEach', insert);

  t.test('find elements by query with fields and options', function(t) {

    numbers
    .query({ value: { $lt: 10, $gte: 5 } })
    .fields({ _id: 0 })
    .options({
      limit: 3,
      sort: { value: -1 }
    })
    .toArray(function(err, results) {
      t.equal(results.length, 3);
      t.deepEqual(results[0], { value: 9 });
      t.deepEqual(results[1], { value: 8 });
      t.deepEqual(results[2], { value: 7 });
      t.end();
    });
  });

  t.test('afterEach', remove);

  t.test('after', function(t) {
    numbers.drop(() => {
      numbers.close();
      t.end();
    });
  });

  function insert(t) {
    function send(value, fn) {
      numbers.insertOne({ value }, fn);
    }

    async.times(TEST_LEN, send, t.end);
  }

  function remove(t) {
    numbers.removeMany({}, t.end);
  }

});

test('bulk', function(t) {
  let items = db.collection({ name: 'items' });

  function insert(t) {
    function send(value, fn) {
      items.insertOne({ _id: value }, fn);
    }

    async.times(10, send, t.end);
  }

  function drop(t) {
    items.drop(t.end);
  }

  t.test('beforeEach', insert);

  t.test('updates multiple documents', function(t) {
    items.bulkWrite([
      { updateOne: { filter: { _id:1 }, update: { $set: { name: 'a' } } } },
      { updateOne: { filter: { _id:2 }, update: { $set: { name: 'b' } } } },
      { updateOne: { filter: { _id:3 }, update: { $set: { name: 'c' } } } }
    ], function(err, results) {
      t.equal(results.nModified, 3);
      t.end();
    });
  });

  t.test('afterEach', drop);

  t.test('after', function(t) {
    items.drop(() => {
      items.close();
      t.end();
    });
  });
});

test('after', dropDatabase);

function dropDatabase(t) {
  db.drop(() => { db.close(); t.end(); });
}

