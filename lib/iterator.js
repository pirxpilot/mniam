const async = require('async');
const debug = require('debug')('mniam');

module.exports = {
  toArray,
  eachSeries,
  eachLimit
};

function _nop() {}

function toArray(cursor, fn) {
  cursor.toArray(function(err, result) {
    cursor.close(_nop);
    fn(err, result);
  });
}

function eachSeries(onItem, cursor, fn) {
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

function eachLimit(limit, onItem, cursor, fn) {
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
