var should = require('should');
var database = require('../lib/database');
var async = require('async');

/*global describe, it, before, after, beforeEach, afterEach */

describe('aggregate', function() {
  before(function(done) {
    this.db = database('mongodb://localhost/mniam-test');
    this.db.drop(done);
  });

  after(function(done) {
    this.db.drop(done);
  });

  beforeEach(function(done) {
    this.collection = this.db.collection({ name: 'books' });
    this.collection.save({
      title : 'this is my title',
      author : 'bob',
      pageViews : 5,
      tags : [ 'fun' , 'good' , 'fun' ],
      other : { foo : 5 },
    }, done);
  });

  afterEach(function() {
    this.collection.close();
  });

  it('should process pipeline', function(done) {
    this.collection
      .aggregate()
      .project({ author: 1, tags: 1 })
      .unwind('$tags')
      .group({
        _id : { tags : '$tags' },
        authors : { $addToSet : '$author' },
        count: { $sum: 1 }
      })
      .sort({ count: -1 })
      .toArray(function(err, results) {
        results.should.eql([
          { _id: { 'tags': 'fun' }, 'authors': [ 'bob' ], count: 2 },
          { _id: { 'tags': 'good' }, 'authors': [ 'bob' ], count: 1 }
        ]);
        done(err);
      });
  });
});
