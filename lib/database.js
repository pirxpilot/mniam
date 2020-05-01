const mongo = require('mongodb');
const async = require('async');
const debug = require('debug')('mniam');

const memo = require('./memo');

module.exports = database;

/**
 * Lazily creates database connections: takes the same parameters as MongoClient.connect
 *
 * @param url {String} mongo DB URL
 * @param opts {Object} hash of server, db and replSet options overwriting defaults from DB URL
 */
function database(url, opts) {
  let self = {
    open,
    close,
    collection,
    drop,
    objectID: require('./object-id')  // deprecated - use mniam.objectID
  };
  let my = {
    openCount: 0,
    url,
    opts: Object.assign({}, opts, { useNewUrlParser: true, useUnifiedTopology: true })
  };

  function doOpen(fn) {
    debug('Connecting: %s', my.url);
    mongo.MongoClient.connect(my.url, my.opts, function(err, client) {
      if (err) {
        debug('Cannot connect to database: %j', err);
        return fn(err);
      }
      my.client = client;
      my.mongoDb = client.db();
      fn(null, my.mongoDb);
    });
  }

  function open(fn) {
    my.openCount += 1;
    if(!my.open) {
      my.open = memo(doOpen);
    }
    debug('Opening DB...', my.openCount);
    my.open(fn);
  }

  function close() {
    if (!my.open) {
      return;
    }
    my.openCount -= 1;
    debug('Closing DB...', my.openCount);
    if(my.openCount < 1) {
      delete my.open;
      my.client.close();
    }
  }

  function collection(spec) {
    spec.db = self;
    return require('./collection')(spec);
  }

  function drop(fn) {
    async.waterfall([
      open,
      (db, fn) => db.dropDatabase(fn)
    ], fn);
  }

  return self;
}
