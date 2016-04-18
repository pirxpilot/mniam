var async = require('async');
var debug = require('debug')('mniam');

module.exports = cursor;

function _nop() {}

function cursor(spec) {
  var self, my = {
    collection: spec.collection,
    query: {},
    fields: {},
    options: {},
    batchSize: 100
  };


  function query(q) {
    my.query = q;
    return self;
  }

  function fields(f) {
    my.fields = f;
    return self;
  }

  function options(o) {
    my.options = o;
    return self;
  }

  function batchSize(bs) {
    my.batchSize = bs;
    return self;
  }


  function cursorWaterfall(tasks, fn) {
    tasks = [
      my.collection.open,
    ].concat(tasks);

    async.waterfall(tasks, fn);
  }

  function findInCollection(collection, fn) {
    var cursor = collection.find(my.query, my.fields, my.options);
    cursor.batchSize(my.batchSize);
    fn(null, cursor);
  }

  function cursorToArray(cursor, fn) {
    cursor.toArray(function(err, result) {
      cursor.close(_nop);
      fn(err, result);
    });
  }

  function cursorEachSeries(onItem, cursor, fn) {
    var done;

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

  function cursorEachLimit(limit, onItem, cursor, fn) {
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

  function toArray(fn) {
    async.waterfall([
      my.collection.open,
      findInCollection,
      cursorToArray
    ], fn);
  }

  function eachSeries(onItem, fn) {
    async.waterfall([
      my.collection.open,
      findInCollection,
      async.apply(cursorEachSeries, onItem)
    ], fn);
  }

  function eachLimit(limit, onItem, fn) {
    async.waterfall([
      my.collection.open,
      findInCollection,
      async.apply(cursorEachLimit, limit, onItem)
    ], fn);
  }

  self = {
    query: query,
    fields: fields,
    options: options,
    batchSize: batchSize,
    toArray: toArray,
    eachLimit: eachLimit,
    eachSeries: eachSeries
  };

  return self;
}
