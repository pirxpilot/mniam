var assert = require('assert');
var database = require('../lib/database');

/*global describe, it*/

describe('collection', function() {
  it('supports crud methods', function(done) {
    var db = database('mongodb://localhost/mniam-test'),
      friends = db.collection({
        name: 'friends',
        indexes: [[{ name: 1 }]]
      });

    friends.save({
      name: 'Alice',
      age: 14,
    }, function(err, item) {
      assert.ifError(err);
      assert.equal(item.name, 'Alice');
      assert.equal(item.age, 14);
      assert.notEqual(null, item._id);

      friends.findAndModify(item._id, {
        $set: {
          age: 15
        }
      }, function(err, item) {
        assert.ifError(err);
        assert.equal(item.name, 'Alice');
        assert.equal(item.age, 15);

        friends.remove({ name: 'Alice' }, function(err) {
          assert.ifError(err);
          done();
          friends.close();
        });
      });
    });
  });
});