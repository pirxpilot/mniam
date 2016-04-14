var should = require('should');
var database = require('../lib/database');
var async = require('async');

/*global describe, it, before */

describe('collection', function() {
  before(function() {
    this.db = database('mongodb://localhost/mniam-test');
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


  it('eachLimit iterates over all elements of collection', function(done) {
    var numbers = this.db.collection({
      name: 'numbers',
      batchSize: 33
    });
    var results = [];
    var TEST_LEN = 421;

    function send(value, fn) {
      numbers.save({ value: value }, fn);
    }

    function receive(item, fn) {
      results[item.value] = true;
      fn();
    }

    async.times(TEST_LEN, send, function() {
      numbers.eachLimit(7, receive, function(err) {
        // need all items received
        results.should.have.length(TEST_LEN);
        // and they all need to be true
        results.filter(function(x) { return x; }).should.have.length(TEST_LEN);

        done(err);
      });
    });

  });

});
