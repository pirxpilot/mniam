var should = require('should');
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
});