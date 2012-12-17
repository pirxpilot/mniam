var assert = require('assert');
var options = require('../lib/options');

/*global describe, it*/

describe('options', function() {

  it('should parse simple URL', function() {
    var opt = options('mongodb://localhost:27018/data');
    assert.equal(opt.dbname, 'data');
    assert.equal(opt.host, 'localhost');
    assert.equal(opt.port, 27018);
  });

  it('should set default port', function() {
    var opt = options('mongodb://localhost/data');
    assert.equal(opt.dbname, 'data');
    assert.equal(opt.host, 'localhost');
    assert.equal(opt.port, 27017);
  });

  it('should parse authentication info', function() {
    var opt = options('mongodb://alice:fdifjsdfio86@berta.mongohq.com:10075/data');
    assert.equal(opt.dbname, 'data');
    assert.equal(opt.host, 'berta.mongohq.com');
    assert.equal(opt.port, 10075);
    assert.equal(opt.username, 'alice');
    assert.equal(opt.password, 'fdifjsdfio86');
  });
});