const { describe, after, it } = require('node:test');
const assert = require('node:assert/strict');

const database = require('../lib/database');

const db = database('mongodb://localhost/mniam-test');

describe('collection', async function () {
  await db.drop();

  after(async function () {
    await db.drop();
    await db.close();
  });

  it('supports crud methods', async function () {
    const friends = db.collection({
      name: 'friends',
      indexes: [[{ name: 1 }]]
    });

    await cleanup(friends);
    after(() => cleanup(friends));

    let item = await friends.insertOne({
      name: 'Alice',
      age: 14
    });
    assert.ok(item);
    assert.equal(item.name, 'Alice');
    assert.equal(item.age, 14);
    assert.ok(item._id);

    item = await friends.findOneAndUpdate(
      { _id: item._id },
      {
        $set: { age: 15 }
      },
      { returnDocument: 'after' }
    );

    assert.ok(item);
    assert.equal(item.name, 'Alice');
    assert.equal(item.age, 15);

    await friends.deleteOne({ name: 'Alice' });
  });

  it('supports findOneAndReplace', async function () {
    const friends = db.collection({
      name: 'friends',
      indexes: [[{ name: 1 }]]
    });
    after(() => cleanup(friends));

    let item = await friends.insertOne({ name: 'Alice', age: 14 });
    item = await friends.findOneAndReplace({ name: 'Alice' }, { name: 'Bob', age: 33 });

    assert.equal(item.name, 'Alice');
    assert.equal(item.age, 14);

    item = await friends.findOne({ name: 'Bob' });

    assert.ok(item, 'should find replaced item');
    assert.equal(item.name, 'Bob');
    assert.equal(item.age, 33);
  });

  it('collection supports findOneAndReplace with options', async function () {
    const friends = db.collection({
      name: 'friends',
      indexes: [[{ name: 1 }]]
    });
    after(() => cleanup(friends));

    let item = await friends.insertOne({ name: 'Alice', age: 14 });
    item = await friends.findOneAndReplace({ name: 'Alice' }, { name: 'Bob', age: 33 }, { returnDocument: 'after' });

    assert.ok(item, 'should return replaced item');
    assert.equal(item.name, 'Bob');
    assert.equal(item.age, 33);
  });

  it('supports findOneAndDelete', async function () {
    const friends = db.collection({
      name: 'friends',
      indexes: [[{ name: 1 }]]
    });
    after(() => cleanup(friends));

    await friends.insertOne({ name: 'Alice', age: 14 });

    let item = await friends.findOneAndDelete({ name: 'Alice' });

    assert.ok(item, 'should return deleted item');
    assert.equal(item.name, 'Alice');
    assert.equal(item.age, 14);

    item = await friends.findOne({ name: 'Alice' });
    assert.ok(!item, 'should not find deleted item');
  });

  it('findOneAndUpdate accepts query as argument', async function () {
    const friends = db.collection({
      name: 'friends',
      indexes: [[{ name: 1 }]]
    });
    after(() => cleanup(friends));

    await friends.insertOne({ name: 'Bob', age: 33 });
    const item = await friends.findOneAndUpdate({ name: 'Bob' }, { $set: { age: 34 } });

    assert.ok(item, 'should return updated item');
    assert.ok(item._id);
    assert.equal(item.name, 'Bob');
    assert.equal(item.age, 34);
  });

  it('distinct', async function () {
    const friends = db.collection({
      name: 'friends',
      indexes: [[{ name: 1 }]]
    });
    after(() => cleanup(friends));
    await friends.insertOne({ name: 'Alice', age: 33 });
    await friends.insertOne({ name: 'Bob', age: 33 });
    await friends.insertOne({ name: 'Celia', age: 22 });

    assert.deepEqual(await friends.distinct('name'), ['Alice', 'Bob', 'Celia']);
    assert.deepEqual(await friends.distinct('name', { age: 33 }), ['Alice', 'Bob']);
    assert.deepEqual(await friends.distinct('age'), [22, 33]);
  });

  it('drop removes all items from collection', async function () {
    const values = db.collection({
      name: 'values'
    });
    after(() => values.close());

    const tasks = [];
    for (let i = 0; i < 10; i++) {
      tasks.push(values.insertOne({ value: `x${i}` }));
    }
    await Promise.all(tasks);

    let items = await values.find();
    assert.equal(items.length, 10, 'should have items after insert');

    await values.drop();
    items = await values.find();
    assert.equal(items.length, 0, 'should be empty after drom');
  });

  it('one', async function () {
    const friends = db.collection({
      name: 'friends',
      indexes: [[{ name: 1 }]]
    });
    after(() => cleanup(friends));

    let item = await friends.insertOne({ name: 'Bob', age: 34 });
    let items = await friends.query({ name: 'Bob' }).toArray();
    assert.equal(items.length, 1);
    item = items[0];
    assert.equal(item.name, 'Bob');
    assert.equal(item.age, 34);
    assert.ok(item._id);
  });

  it('many', async function () {
    const friends = db.collection({
      name: 'friends',
      indexes: [[{ name: 1 }]]
    });
    after(() => cleanup(friends));

    let items = await friends.insertMany([
      { name: 'Bob', age: 33 },
      { name: 'Alice', age: 20 },
      { name: 'Cyril', age: 21 }
    ]);
    assert.equal(Object.keys(items).length, 3);

    items = await friends.query({ name: 'Bob' }).toArray();
    assert.equal(items.length, 1);

    let item = items[0];
    assert.equal(item.name, 'Bob');
    assert.equal(item.age, 33);
    assert.ok(item._id);

    items = await friends.query({ name: 'Alice' }).toArray();
    assert.equal(items.length, 1);
    item = items[0];
    assert.equal(item.name, 'Alice');
    assert.equal(item.age, 20);
    assert.ok(item._id);
  });
});

async function cleanup(collection) {
  await collection.drop();
}
