const iterator = require('./iterator');

module.exports = cursor;

function cursor(spec) {
  let self = {
    query,
    fields,
    limit,
    options,
    batchSize,
    toArray,
    eachLimit,
    eachSeries
  };

  let my = {
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

  function limit(l) {
    my.limit = l;
    return self;
  }

  async function findInCollection() {
    const collection = await my.collection.open();
    const cursor = collection.find(my.query, my.options);
    cursor.batchSize(my.batchSize).project(my.fields);
    if (my.limit) {
      cursor.limit(my.limit);
    }
    return cursor;
  }

  async function toArray() {
    const cursor = await findInCollection();
    return iterator.toArray(cursor);
  }

  async function eachSeries(onItem) {
    const cursor = await findInCollection();
    return iterator.eachSeries(onItem, cursor);
  }

  async function eachLimit(limit, onItem) {
    const cursor = await findInCollection();
    return iterator.eachLimit(limit, onItem, cursor);
  }

  return self;
}
