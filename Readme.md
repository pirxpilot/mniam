[![Build Status](https://img.shields.io/travis/pirxpilot/mniam.svg)](http://travis-ci.org/pirxpilot/mniam)
[![Dependency Status](https://img.shields.io/gemnasium/pirxpilot/mniam.svg)](https://gemnasium.com/pirxpilot/mniam)
[![NPM version](https://img.shields.io/npm/v/mniam.svg)](http://badge.fury.io/js/mniam)

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
var db = database('mongodb://localhost/mniam-test'),
  friends = db.collection({
    name: 'friends',
    indexes: [[{ name: 1 }]]
  });
```

Mniam is using [MongoClient][3] to establish the connection: [full mongo database URLs][4] are
supported. The database function also takes a hash of options divided into db/server/replset/mongos
allowing you to tweak options not directly supported by the unified url string format.

```javascript
var db = database('mongodb://localhost/mniam-test', {
  db: {
    w: -1
  },
  server: {
    ssl: true
  }
})
```

### `collection.save`

Add a new documents:

```javascript
friends.save({
  name: 'Alice',
  age: 14,
}, function(err, item) {
	console.log('Item id:', item._id);
});
```

### `collection.findAndModify`

Update a document:

```javascript
friends.findAndModify(item._id, {
  $set: { age: 15 }
}, function(err, item) {
  console.log('Alice is now:', item.age);
})
```

### `collection.remove`

Remove a document:

```javascript
friends.remove({ name: 'Alice' }, function(err) {
  // last collection closed closes DB connection
  friends.close();
});
```

### Iteration

Use `query`, `fields` and `options` to create and configure cursor.
Iterate over the results of the query using `toArray`, `eachSeries`, `eachLimit` methods.

- `toArray` - converts query results into array

```javascript
friends.query({ age: { $gt: 21 } }).toArray(function(err, arr) {
  console.log('My friends over 21 years old', arr);
});
```

- `eachSeries` - calls `onItem` sequentially for all results

```javascript
friends.query().fields({ name: 1 }).eachSeries(function onItem(item, fn) {
  console.log('Name:', item.name);
  fn();
}, function done(err) {
  console.log('All friends listed.');
});
```

- `eachLimit` - iterates over all results calling `onItem` in parallel, but no more than `limit` at a time

```javascript
friends.query().options({ sort: { age: 1 } }).eachLimit(4, function onItem(item, fn) {
  console.log('Friend', item);
  fn();
}, function done(err) {
  console.log('All friends listed.');
});
```

### Other collection methods supported

- `collection.geonear`
- `collection.findOne`
- `collection.update`

## License

MIT


[mongodb]: http://www.mongodb.org
[2]: http://github.com/mongodb/node-mongodb-native.git
[3]: http://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html
[4]: http://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html#the-url-connection-format

