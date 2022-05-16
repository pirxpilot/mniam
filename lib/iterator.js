const debug = require('debug')('mniam');

module.exports = {
  toArray,
  eachSeries,
  eachLimit
};

async function toArray(cursor) {
  const result = await cursor.toArray();
  cursor.close();
  return result;
}

async function eachSeries(onItem, cursor) {
  while (true) {
    const item = await cursor.next();
    if (!item) {
      break;
    }
    await onItem(item);
  }
  cursor.close();
}

async function eachLimit(limit, onItem, cursor) {
  async function push(slot) {
    const item = await cursor.next();
    await onItem(item);
    return slot;
  }

  while (await cursor.hasNext()) {
    let len = cursor.bufferedCount();
    debug('buffered documents %d', len);

    while (len > 0) {
      const queue = [];
      const l = Math.min(limit, len);
      for (let i = 0; i < l; i++) {
        queue.push(push(i));
      }
      len -= l;
      // FIXME: should keep Promise.race'ing here
      await Promise.all(queue);
    }
  }
}
