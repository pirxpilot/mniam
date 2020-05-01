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
  function run(fn) {
    cursor.next(push);

    function push(err, item) {
      if (err) return fn(err);
      if (!item) return fn(null, true);
      onItem(item, err => fn(err, false));
    }
  }

  async.doUntil(
    run,
    (done, fn) => fn(null, done),
    err => cursor.close() && fn(err)
  );
}

function eachLimit(limit, onItem, cursor, fn) {

  function run(fn) {
    const queue = async.queue(onItem, limit);
    queue.drain(fn);

    let len = cursor.bufferedCount();
    debug('buffered documents %d', len);

    while(len--) {
      cursor.next(push);
    }

    function push(err, item) {
      if (err) return fn(err);
      queue.push(item);
    }
  }

  async.whilst(
    fn => cursor.hasNext(fn),
    run,
    err => cursor.close() && fn(err)
  );
}
