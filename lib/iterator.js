const async = require('async');
const debug = require('debug')('mniam');

module.exports = {
  toArray,
  eachSeries,
  eachLimit
};

function toArray(cursor, fn) {
  cursor.toArray(function(err, result) {
    cursor.close();
    fn(err, result);
  });
}

function eachSeries(onItem, cursor, fn) {
  let done = false;

  function run(fn) {
    cursor.next(push);

    function push(err, item) {
      if (err) return fn(err);
      if (!item) {
        done = true;
        return fn();
      }
      onItem(item, fn);
    }
  }

  async.until(
    () => done,
    run,
    err => cursor.close() && fn(err)
  );
}

function eachLimit(limit, onItem, cursor, fn) {

  function run(fn) {
    const queue = async.queue(onItem, limit);
    queue.drain = fn;

    // need to add 1 because hasNext creates an extra 1 doc buffer
    let len = cursor.bufferedCount() + 1;
    debug('buffered documents %d', len);

    while(len--) {
      cursor.next(push);
    }

    function push(err, item) {
      if (err) return fn(err);
      queue.push(item);
    }
  }

  async.during(
    fn => cursor.hasNext(fn),
    run,
    err => cursor.close() && fn(err)
  );
}
