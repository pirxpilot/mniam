const test = require('tape');

const database = require('../lib/database');

const db = database('mongodb://localhost/mniam-test');

test('collection', async function (t) {
  await db.drop();

  t.teardown(async function () {
    await db.drop();
    await db.close();
  });

  t.test('supports crud methods', async function (t) {
    const friends = db.collection({
      name: 'friends',
      indexes: [[{ name: 1 }]]
    });

    await cleanup(friends);
    t.teardown(() => cleanup(friends));

    let item = await friends.insertOne({
      name: 'Alice',
      age: 14
    });
    t.ok(item);
    t.equal(item.name, 'Alice');
    t.equal(item.age, 14);
    t.ok(item._id);

    item = await friends.findOneAndUpdate(
      { _id: item._id },
      {
        $set: { age: 15 }
      },
      { returnDocument: 'after' }
    );

    t.ok(item);
    t.equal(item.name, 'Alice');
    t.equal(item.age, 15);

    await friends.deleteOne({ name: 'Alice' });
  });

  t.test('supports findOneAndReplace', async function (t) {
    const friends = db.collection({
      name: 'friends',
      indexes: [[{ name: 1 }]]
    });
    t.teardown(() => cleanup(friends));

    let item = await friends.insertOne({ name: 'Alice', age: 14 });
    item = await friends.findOneAndReplace(
      { name: 'Alice' },
      { name: 'Bob', age: 33 }
    );

    t.equal(item.name, 'Alice');
    t.equal(item.age, 14);

    item = await friends.findOne({ name: 'Bob' });

    t.ok(item, 'should find replaced item');
    t.equal(item.name, 'Bob');
    t.equal(item.age, 33);
  });

  t.test(
    'collection supports findOneAndReplace with options',
    async function (t) {
      const friends = db.collection({
        name: 'friends',
        indexes: [[{ name: 1 }]]
      });
      t.teardown(() => cleanup(friends));

      let item = await friends.insertOne({ name: 'Alice', age: 14 });
      item = await friends.findOneAndReplace(
        { name: 'Alice' },
        { name: 'Bob', age: 33 },
        { returnDocument: 'after' }
      );

      t.ok(item, 'should return replaced item');
      t.equal(item.name, 'Bob');
      t.equal(item.age, 33);
    }
  );

  t.test('supports findOneAndDelete', async function (t) {
    const friends = db.collection({
      name: 'friends',
      indexes: [[{ name: 1 }]]
    });
    t.teardown(() => cleanup(friends));

    await friends.insertOne({ name: 'Alice', age: 14 });

    let item = await friends.findOneAndDelete({ name: 'Alice' });

    t.ok(item, 'should return deleted item');
    t.equal(item.name, 'Alice');
    t.equal(item.age, 14);

    item = await friends.findOne({ name: 'Alice' });
    t.notOk(item, 'should not find deleted item');
  });

  t.test('findOneAndUpdate accepts query as argument', async function (t) {
    const friends = db.collection({
      name: 'friends',
      indexes: [[{ name: 1 }]]
    });
    t.teardown(() => cleanup(friends));

    await friends.insertOne({ name: 'Bob', age: 33 });
    const item = await friends.findOneAndUpdate(
      { name: 'Bob' },
      { $set: { age: 34 } }
    );

    t.ok(item, 'should return updated item');
    t.ok(item._id);
    t.equal(item.name, 'Bob');
    t.equal(item.age, 34);
  });

  t.test('distinct', async function (t) {
    const friends = db.collection({
      name: 'friends',
      indexes: [[{ name: 1 }]]
    });
    t.teardown(() => cleanup(friends));
    await friends.insertOne({ name: 'Alice', age: 33 });
    await friends.insertOne({ name: 'Bob', age: 33 });
    await friends.insertOne({ name: 'Celia', age: 22 });

    t.deepEqual(await friends.distinct('name'), ['Alice', 'Bob', 'Celia']);
    t.deepEqual(await friends.distinct('name', { age: 33 }), ['Alice', 'Bob']);
    t.deepEqual(await friends.distinct('age'), [22, 33]);
  });

  t.test('drop removes all items from collection', async function (t) {
    const values = db.collection({
      name: 'values'
    });
    t.teardown(() => values.close());

    const tasks = [];
    for (let i = 0; i < 10; i++) {
      tasks.push(values.insertOne({ value: `x${i}` }));
    }
    await Promise.all(tasks);

    let items = await values.find();
    t.equal(items.length, 10, 'should have items after insert');

    await values.drop();
    items = await values.find();
    t.equal(items.length, 0, 'should be empty after drom');
  });

  t.test('one', async function (t) {
    const friends = db.collection({
      name: 'friends',
      indexes: [[{ name: 1 }]]
    });
    t.teardown(() => cleanup(friends));

    let item = await friends.insertOne({ name: 'Bob', age: 34 });
    let items = await friends.query({ name: 'Bob' }).toArray();
    t.equal(items.length, 1);
    item = items[0];
    t.equal(item.name, 'Bob');
    t.equal(item.age, 34);
    t.ok(item._id);
  });

  t.test('many', async function (t) {
    const friends = db.collection({
      name: 'friends',
      indexes: [[{ name: 1 }]]
    });
    t.teardown(() => cleanup(friends));

    let items = await friends.insertMany([
      { name: 'Bob', age: 33 },
      { name: 'Alice', age: 20 },
      { name: 'Cyril', age: 21 }
    ]);
    t.deepEquals(Object.keys(items).length, 3);

    items = await friends.query({ name: 'Bob' }).toArray();
    t.equal(items.length, 1);

    let item = items[0];
    t.equal(item.name, 'Bob');
    t.equal(item.age, 33);
    t.ok(item._id);

    items = await friends.query({ name: 'Alice' }).toArray();
    t.equal(items.length, 1);
    item = items[0];
    t.equal(item.name, 'Alice');
    t.equal(item.age, 20);
    t.ok(item._id);
  });
});

async function cleanup(collection) {
  await collection.drop();
}
