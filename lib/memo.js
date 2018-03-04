module.exports = memo;

// like async memoize but, does not memoize errors and does works for async functions that do not take parameters
function memo(asyncFn) {
  let queue = [];
  let result;

  function doWork() {
    asyncFn(function(err, r) {
      if (!err) {
        result = r;
      }
      queue.forEach(fn => fn(err, result));
      queue = [];
    });
  }

  function memoized(fn) {
    if (result) {
      setImmediate(_ => fn(null, result));
      return;
    }
    queue.push(fn);
    if (queue.length === 1) {
      doWork();
    }
  }

  return memoized;
}
