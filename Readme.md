# mniam [![Build Status](https://secure.travis-ci.org/code42day/mniam.png)](http://travis-ci.org/code42day/mniam)


Yet another [mongodb][] [native driver][2] facade.
Takes care of:

- mongo URI parsing
- opening and closing DB connections
- opening collections

Install by running

    npm install mniam

## API

Connect to database `mniam-test` and create `friends` collection with index on ```name``` field.

```javascript
var db = database('mongodb://localhost/mniam-test'),
  friends = db.collection({
    name: 'friends',
    indexes: [[{ name: 1 }]]
  });
```

Add a new documents:

```javascript
friends.save({
  name: 'Alice',
  age: 14,
}, function(err, item) {
	console.log('Item id:', item._id);
});
```

Update a document:

```javascript
friends.findAndModify(item._id, {
  $set: { age: 15 }
}, function(err, item) {
  console.log('Alice is now:', item.age);
})
```

Remove a document:

```javascript
friends.remove({ name: 'Alice' }, function(err) {
  // last collection closed closes DB connection
  friends.close();
});

```

## License

MIT


[mongodb]: http://www.mongodb.org
[2]: http://github.com/mongodb/node-mongodb-native.git
