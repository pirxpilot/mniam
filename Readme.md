[![NPM version][npm-image]][npm-url]
[![Build Status][build-image]][build-url]
[![Dependency Status][deps-image]][deps-url]

# mniam


Yet another [mongodb][] [native driver][2] facade.
Takes care of:

- mongo URI parsing
- opening and closing DB connections
- opening collections

Install by running

    npm install mniam

## API


### `database(url, [options])`

Connect to database `mniam-test` and create `friends` collection with index on ```name``` field.

```javascript
const db = database('mongodb://localhost/mniam-test');
const friends = db.collection({
  name: 'friends',
  indexes: [[{ name: 1 }]]
});
```

Mniam is using [MongoClient][3] to establish the connection: [full mongo database URLs][4] are
supported. The database function also takes a hash of options divided into db/server/replset/mongos
allowing you to tweak options not directly supported by the unified url string format.

```javascript
const db = database('mongodb://localhost/mniam-test', {
  db: {
    w: -1
  },
  server: {
    ssl: true
  }
});
```

### `collection.save`

Add a new documents:

```javascript
const item = await friends.save({
  name: 'Alice',
  age: 14,
};
console.log('Item id:', item._id);
```

### `collection.findOneAndUpdate`

Update a document:

```javascript
const item = await friends.findAndModify({ _id: item._id }, {
  $set: { age: 15 }
});
console.log('Alice is now:', item.age);
```

### `collection.deleteOne`

Remove a document:

```javascript
await friends.deleteOne({ name: 'Alice' });
```

### Iteration

Use `query`, `fields` and `options` to create and configure cursor.
Iterate over the results of the query using `toArray`, `eachSeries`, `eachLimit` methods.

- `items` - can be used as async iterator

```javascript
for await (const friend of friends.query({ age: { $gt: 21 } }).items()) {
  console.log('My friend over 21 years old', friend.name);
}
```

- `toArray` - converts query results into array

```javascript
const arr = await friends.query({ age: { $gt: 21 } }).toArray();
console.log('My friends over 21 years old', arr);
```

- `eachSeries` - calls `onItem` sequentially for all results

```javascript
await friends
  .query()
  .fields({ name: 1 })
  .eachSeries(async item => console.log('Name:', item.name));
console.log('All friends listed.');
```

- `eachLimit` - iterates over all results calling `onItem` in parallel, but no more than `limit` at a time

```javascript
await friends
  .query()
  .options({ sort: { age: 1 } })
  .eachLimit(4, async item => console.log('Friend', item));
console.log('All friends listed.');
```

### Aggregation

Mniam collections provides flex API for [aggregation] pipeline:

```javascript
const results = await friends
  .aggregate()      // start pipeline
  .project({ author: 1, tags: 1 })
  .unwind('$tags')
  .group({
    _id : { tags : '$tags' },
    authors : { $addToSet : '$author' },
    count: { $sum: 1 }
  })
  .sort({ count: -1 })
  .toArray();
console.log(results);
```

In addition to `toArray` you can use `eachSeries` and `eachLimit` to iterate over aggregation results.
Each aggregation stage (`$project`, `$unwind`, `$sort`, etc.) has a corresponding function with the same
name (without `$`). You can also pass a traditional array of stages to `.pipeline(stages)` method, and set
options with `.options({})` method.

## License

MIT

[mongodb]: http://www.mongodb.org
[2]: http://github.com/mongodb/node-mongodb-native.git
[3]: http://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html
[4]: http://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html#the-url-connection-format
[aggregation]: https://docs.mongodb.com/manual/core/aggregation-pipeline/

[npm-url]: https://npmjs.org/package/mniam
[npm-image]: https://img.shields.io/npm/v/mniam

[build-url]: https://github.com/pirxpilot/mniam/actions/workflows/check.yaml
[build-image]: https://img.shields.io/github/workflow/status/pirxpilot/mniam/check

[deps-image]: https://img.shields.io/librariesio/release/npm/mniam
[deps-url]: https://libraries.io/npm/mniam
