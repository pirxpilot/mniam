var should = require('should');
var database = require('../lib/database');
var async = require('async');

/*global describe, it, before, after, beforeEach, afterEach */

describe('collection', function() {
  before(function(done) {
    this.db = database('mongodb://localhost/mniam-test');
    this.db.drop(done);
  });

  after(function(done) {
    this.db.drop(done);
  });

  it('supports crud methods', function(done) {
    var friends = this.db.collection({
      name: 'friends',
      indexes: [[{ name: 1 }]]
    });

    friends.save({
      name: 'Alice',
      age: 14,
    }, function(err, item) {
      should.not.exist(err);
      should.exist(item);
      item.should.have.property('name', 'Alice');
      item.should.have.property('age', 14);
      item.should.have.property('_id');

      friends.findAndModify(item._id, {
        $set: {
          age: 15
        }
      }, function(err, item) {
        should.not.exist(err);
        should.exist(item);
        item.should.have.property('name', 'Alice');
        item.should.have.property('age', 15);

        friends.remove({ name: 'Alice' }, function(err) {
          done(err);
          friends.close();
        });
      });
    });
  });

  it('findAndModify accepts query as argument', function(done) {
    var friends = this.db.collection({
      name: 'friends',
      indexes: [[{ name: 1 }]]
    });

    async.waterfall([
      function(fn) {
        friends.save({name: 'Bob', age: 33 }, fn);
      },
      function(item, fn) {
        friends.findAndModify({ name: 'Bob' }, { $set: {age: 34 } }, fn);
      },
      function(item, fn) {
        item.should.have.property('name', 'Bob');
        item.should.have.property('age', 34);
        item.should.have.property('_id');
        fn();
      }
    ], done);
  });


  it('drop removes all items from collection', function(done) {
    var values = this.db.collection({
      name: 'values',
    });

    async.series([
      function(fn) {
        async.times(10, function(i, fn) {
          values.save({ value: 'x' + i }, fn);
        }, fn);
      },
      function(fn) {
        values.find({}, {}, {}, function(err, items) {
          items.should.have.length(10);
          fn(err);
        });
      },
      function(fn) {
        values.drop(fn);
      },
      function(fn) {
        values.find({}, {}, {}, function(err, items) {
          items.should.have.length(0);
          fn(err);
        });
      }
    ], done);
  });

  describe('should insert', function() {
    beforeEach(function(done) {
      var friends = this.db.collection({ name: 'friends' });
      friends.drop(done);
    });

    it('one', function(done) {
      var friends = this.db.collection({
        name: 'friends',
        indexes: [[{ name: 1 }]]
      });

      async.waterfall([
        function(fn) {
          friends.insertOne({name: 'Bob', age: 34 }, fn);
        },
        function(item, fn) {
          friends.query({ name: 'Bob' }).toArray(fn);
        },
        function(items, fn) {
          items.should.have.length(1);
          let item = items[0];
          item.should.have.property('name', 'Bob');
          item.should.have.property('age', 34);
          item.should.have.property('_id');
          fn();
        }
      ], done);
    });


    it('many', function(done) {
      var friends = this.db.collection({
        name: 'friends',
        indexes: [[{ name: 1 }]]
      });

      async.waterfall([
        function(fn) {
          friends.insertMany([
            {name: 'Bob', age: 33 },
            {name: 'Alice', age: 20 },
            {name: 'Cyril', age: 21 }
          ], fn);
        },
        function(item, fn) {
          friends.query({ name: 'Bob' }).toArray(fn);
        },
        function(items, fn) {
          items.should.have.length(1);
          let item = items[0];
          item.should.have.property('name', 'Bob');
          item.should.have.property('age', 33);
          item.should.have.property('_id');
          fn();
        },
        function(fn) {
          friends.query({ name: 'Alice' }).toArray(fn);
        },
        function(items, fn) {
          items.should.have.length(1);
          let item = items[0];
          item.should.have.property('name', 'Alice');
          item.should.have.property('age', 20);
          item.should.have.property('_id');
          fn();
        }
      ], done);
    });
  });

  describe('query', function() {
    var TEST_LEN = 421;

    before(function() {
      this.numbers = this.db.collection({
        name: 'numbers',
        batchSize: 33
      });
    });

    beforeEach(function(done) {
      var numbers = this.numbers;

      function send(value, fn) {
        numbers.save({ value: value }, fn);
      }

      async.times(TEST_LEN, send, done);
    });

    afterEach(function(done) {
      this.numbers.drop(done);
    });

    it('eachLimit iterates over all elements of collection', function(done) {
      var numbers = this.numbers;
      var results = [];

      function receive(item, fn) {
        results[item.value] = true;
        async.setImmediate(fn);
      }

      numbers.eachLimit(7, receive, function(err) {
        // need all items received
        results.should.have.length(TEST_LEN);
        // and they all need to be true
        results.filter(function(x) { return x; }).should.have.length(TEST_LEN);

        done(err);
      });
    });

    it('find elements by query', function(done) {
      var numbers = this.numbers;
      var results = [];

      function receive(item, fn) {
        results.push({ value: item.value });
        async.setImmediate(fn);
      }

      numbers
      .query({ value: 10 })
      .eachSeries(receive, function(err) {
        results.should.have.length(1);
        results[0].should.eql({ value: 10 });

        done(err);
      });
    });

    it('find elements by query with fields and options', function(done) {
      var numbers = this.numbers;

      numbers
      .query({ value: { $lt: 10, $gte: 5 } })
      .fields({ _id: 0 })
      .options({
        limit: 3,
        sort: { value: -1 }
      })
      .toArray(function(err, results) {
        results.should.have.length(3);
        results[0].should.eql({ value: 9 });
        results[1].should.eql({ value: 8 });
        results[2].should.eql({ value: 7 });
        done(err);
      });
    });
  });

  describe('bulk', function() {
    before(function() {
      this.items = this.db.collection({ name: 'items' });
    });

    beforeEach(function(done) {
      var items = this.items;

      function send(value, fn) {
        items.save({ _id: value }, fn);
      }

      async.times(10, send, done);
    });

    afterEach(function(done) {
      this.items.drop(done);
    });

    it('updates multiple documents', function(done) {
      this.items.bulkWrite([
        { updateOne: { filter: { _id:1 }, update: { $set: { name: 'a' } } } },
        { updateOne: { filter: { _id:2 }, update: { $set: { name: 'b' } } } },
        { updateOne: { filter: { _id:3 }, update: { $set: { name: 'c' } } } }
      ], function(err, results) {
        results.nModified.should.eql(3);
        done();
      });
    });
  });
});
