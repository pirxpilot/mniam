const test = require('tape');

const database = require('../lib/database');

const db = database('mongodb://localhost/mniam-test');

test('query', async function (t) {
  const TEST_LEN = 421;

  await db.drop();
  t.teardown(async function () {
    await db.drop();
    await db.close();
  });

  const numbers = db.collection({
    name: 'numbers',
    batchSize: 33
  });

  t.test('eachLimit iterates over all elements', async function (t) {
    t.teardown(remove);
    await insert();

    const results = [];

    async function visit(item) {
      function fn(resolve) {
        setTimeout(() => {
          results[item.value] = true;
          resolve(true);
        });
      }
      return new Promise(fn);
    }

    await numbers.eachLimit(7, visit);

    t.equal(results.length, TEST_LEN, 'all items visited');
    t.equal(results.filter(Boolean).length, TEST_LEN, 'and they all are true');
  });

  t.test('for await iterates over all elements', async function (t) {
    t.teardown(remove);
    await insert();

    const results = [];

    const items = await numbers.query().items();
    for await(const { value } of items) {
      results[value] = true;
    }

    t.equal(results.length, TEST_LEN, 'all items visited');
    t.equal(results.filter(Boolean).length, TEST_LEN, 'and they all are true');
  });

  t.test('find elements by query', async function (t) {
    t.teardown(remove);
    await insert();

    const results = [];
    function receive(item) {
      results.push({ value: item.value });
    }

    await numbers.query({ value: 10 }).eachSeries(receive);

    t.equal(results.length, 1, 'only one element is found');
    t.deepEqual(
      results[0],
      { value: 10 },
      'and its value is what we were looking for'
    );
  });

  t.test('find elements by query with fields and options', async function (t) {
    t.teardown(remove);
    await insert();

    const results = await numbers
      .query({ value: { $lt: 10, $gte: 5 } })
      .fields({ _id: 0 })
      .options({
        limit: 3,
        sort: { value: -1 }
      })
      .toArray();

    t.equal(results.length, 3);
    t.deepEqual(results[0], { value: 9 });
    t.deepEqual(results[1], { value: 8 });
    t.deepEqual(results[2], { value: 7 });
  });

  async function insert() {
    const tasks = [];
    for (let value = 0; value < TEST_LEN; value++) {
      tasks.push(numbers.insertOne({ value }));
    }
    await Promise.all(tasks);
  }

  async function remove() {
    await numbers.drop();
    await numbers.close();
  }

  t.test('bulk updates multiple documents', async function (t) {
    let items = db.collection({ name: 'items' });

    t.teardown(async function drop() {
      await items.drop();
      await items.close();
    });

    await insert();

    const results = await items.bulkWrite([
      { updateOne: { filter: { _id: 1 }, update: { $set: { name: 'a' } } } },
      { updateOne: { filter: { _id: 2 }, update: { $set: { name: 'b' } } } },
      { updateOne: { filter: { _id: 3 }, update: { $set: { name: 'c' } } } }
    ]);

    t.equal(results.nModified, 3);

    async function insert() {
      const tasks = [];
      for (let _id = 0; _id < 10; _id++) {
        tasks.push(items.insertOne({ _id }));
      }
      await Promise.all(tasks);
    }
  });
});
