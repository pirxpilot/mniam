var mongo = require('mongodb');
var async = require('async');
var debug = require('debug')('mniam');

module.exports = database;

/**
 * Lazily creates database connections: takes the same parameters as MongoClient.connect
 *
 * @param url {String} mongo DB URL
 * @param opts {Object} hash of server, db and replSet options overwriting defaults from DB URL
 */
function database(url, opts) {
  var self, my = {};

  function doOpen(fn) {
    mongo.MongoClient.connect(url, opts, function(err, db) {
      my.mongoDb = db;
      fn(err, my.mongoDb);
    });
  }

  function open(fn) {
    my.openCount += 1;
    if(!my.open) {
      my.open = async.memoize(doOpen, function() {
        return 'db';
      });
    }
    debug('Opening DB...', my.openCount);
    my.open(fn);
  }

  function close() {
    my.openCount -= 1;
    debug('Closing DB...', my.openCount);
    if(my.openCount < 1) {
      delete my.open;
      my.mongoDb.close();
    }
  }

  function collection(spec) {
    spec.db = self;
    return require('./collection')(spec);
  }

  function drop(fn) {
    async.waterfall([
      open,
      function (db, fn) {
        db.dropDatabase(fn);
      }
    ], fn);
  }

  my = {
    openCount: 0,
  };

  self = {
    open: open,
    close: close,
    collection: collection,
    drop: drop,
    objectID: require('./object-id')  // deprecated - use mniam.objectID
  };

  return self;
}
