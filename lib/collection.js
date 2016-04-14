var util = require('util');
var async = require('async');
var debug = require('debug')('mniam');

module.exports = collection;

function _nop() {}

/**
 * Creates a collection object for the database
 *
 * @param spec.name name of the collection
 * @param spec.indexes array of tuples specifying Mongo index as a tuple { fields,
 *          options }
 * @param spec.db database
 *
 * @returns collection object
 */

function collection(spec) {
  var self, my = {
    name: spec.name,
    db: spec.db,
    batchSize: 100
  };

  function ensureIndex(collection, fn) {
    debug('Ensuring %d indexes', my.indexes.length);
    async.forEach(my.indexes, function(index, fn) {
      collection.ensureIndex(index[0], index[1], fn);
    }, fn);
  }

  function doOpen(fn) {
    debug('Opening collection %s', my.name);
    async.waterfall([
      my.db.open,
      function(mongoDb, fn) {
        mongoDb.collection(my.name, fn);
      },
      function(mongoCollection, fn) {
        my.mongoCollection = mongoCollection;
        ensureIndex(mongoCollection, fn);
      }
    ], function(err) {
      fn(err, my.mongoCollection);
    });
  }

  function open(fn) {
    if(!my.open) {
      my.open = async.memoize(doOpen, function() { return 'collection'; });
    }
    my.open(fn);
  }

  function close() {
    debug('Closing collection %s', my.name);
    delete my.mongoCollection;
    delete my.open;
    my.db.close();
  }

  function batchSize(bs) {
    my.batchSize = bs;
    return self;
  }

  function geoNear(ll, options, fn) {
    debug('geoNear %j %j', ll, options);
    async.waterfall([
      open,
      function(collection, fn) {
        collection.geoNear(ll[0], ll[1], options, fn);
      }
    ], fn);
  }

  function find(query, fields, options, fn) {
    debug('find %j %j %j', query, fields, options);
    async.waterfall([
      open,
      function(collection, fn) {
        var cursor = collection.find(query, fields, options);
        cursor.toArray(function(err, result) {
          cursor.close(_nop);
          fn(err, result);
        });
      }
    ], fn);
  }

  function forEach(onItem, fn) {
    var cursor;
    debug('forEach');
    async.waterfall([
      open,
      function(collection, fn) {
        var
          done,
          cursor = collection.find();

        cursor.batchSize(my.batchSize);
        async.until(
          function() { return done; },
          function(fn) {
            cursor.nextObject(function(err, item) {
              if (err) { return fn(err); }
              if (!item) {
                done = true;
                return fn();
              }
              onItem(item, fn);
            });
          },
          function(err) {
            cursor.close(_nop);
            fn(err);
          }
        );
      }
    ], fn);
  }

  // similar to forEach but processes items in packets up to `limit` size
  function eachLimit(limit, onItem, fn) {
    var cursor;
    debug('each with limit %d', limit);
    async.waterfall([
      open,
      function(collection, fn) {
        var cursor = collection.find();

        cursor.batchSize(my.batchSize);

        async.during(
          function(fn) { cursor.hasNext(fn); },
          function(fn) {
            var i, len, queue;

            function push(err, item) {
              if (err) { return fn(err); }
              queue.push(item);
            }

            queue = async.queue(onItem, limit);
            queue.drain = fn;
            // need to add 1 because hasNext creates an extra 1 doc buffer
            len = cursor.bufferedCount() + 1;

            debug('buffered documents %d', len);

            for(i = 0; i < len; i++) {
              cursor.nextObject(push);
            }
          },
          function(err) {
            cursor.close(_nop);
            fn(err);
          }
        );
      }
    ], fn);
  }

  function findAndModify(id, update, fn) {
    debug('findAndModify %s', id);
    async.waterfall([
      open,
      function(collection, fn) {
        collection.findAndModify(
          { _id: id },
          [['_id', 'asc']],
          update,
          { 'new': true },
          fn);
      }
    ], function(err, result) {
      fn(err, result && result.value);
    });
  }

  function findOne(query, fn) {
    debug('findOne %j', query);
    async.waterfall([
      open,
      function(collection, fn) {
        self.find(query, undefined, undefined, function(err, items) {
          if(err) { return fn(err); }
          err = items.length > 0 ? null : 'no items found' + util.inspect(query);
          fn(err, items[0]);
        });
      }
    ], fn);
  }

  function remove(query, fn) {
    debug('remove %j', query);
    async.waterfall([
      open,
      function(collection, fn) {
        collection.remove(query, fn);
      }
    ], fn);
  }

  function save(item, fn) {
    debug('save %j', item);
    async.waterfall([
      open,
      function(collection, fn) {
        collection.save(item, { safe: true }, function(err) {
          if(err) { return fn(err); }
          fn(null, item);
        });
      }
    ], fn);
  }

  function update(id, data, options, fn) {
    debug('update %s', id);
    if (typeof fn === 'undefined') {
      fn = options;
      options = { upsert: true };
    }
    async.waterfall([
      open,
      function(collection, fn) {
        collection.update({_id: id }, data, options, fn);
      }
    ], fn);
  }

  function indexInformation(fn) {
    my.mongoCollection.indexInformation(fn);
  }

  my.indexes = spec.indexes || [];
  self = {
    batchSize: batchSize,
    find: find,
    forEach: forEach,
    eachLimit: eachLimit,
    geoNear: geoNear,
    findOne: findOne,
    findAndModify: findAndModify,
    remove: remove,
    save: save,
    update: update,
    indexInformation: indexInformation,
    close: close,
    objectID: require('./object-id') // deprecated - use mniam.objectID
  };

  return self;
}
