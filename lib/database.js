var mongo = require('mongodb');
var async = require('async');
var options = require('./options');

module.exports = database;

function database(url) {
  var self, my = {};

  function mongoServer() {
    return new mongo.Server(my.options.host, my.options.port);
  }

  function mongoDb() {
    my.mongoDb = my.mongoDb || new mongo.Db(my.options.dbname, mongoServer());
    return my.mongoDb;
  }

  function authenticate(db, fn) {
    if(my.options.username) {
      db.authenticate(my.options.username, my.options.password, function(err) {
        fn(err, db);
      });
    } else {
      fn(null, db);
    }
  }

  function doOpen(fn) {
    async.waterfall([

    function(fn) {
      mongoDb().open(fn);
    },
    authenticate], fn);
  }

  function open(fn) {
    my.openCount += 1;
    if(!my.open) {
      my.open = async.memoize(doOpen, function() {
        return 'db';
      });
    }
    // console.log('Opening DB...', my.openCount);
    my.open(fn);
  }

  function close() {
    my.openCount -= 1;
    // console.log('Closing DB...', my.openCount);
    if(my.openCount < 1) {
      delete my.open;
      mongoDb().close();
    }
  }

  function objectID(id) {
    var ObjectID = mongoDb().bson_serializer.ObjectID;
    return new ObjectID(id);
  }

  function collection(spec) {
    spec.db = self;
    return require('./collection')(spec);
  }

  my = {
    options: options(url),
    openCount: 0,
  };

  self = {
    open: open,
    close: close,
    collection: collection,
    objectID: objectID
  };

  return self;
}