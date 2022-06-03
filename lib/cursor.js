const iterator = require('./iterator');

module.exports = cursor;

function cursor(spec) {
  let self = {
    query,
    fields,
    limit,
    options,
    batchSize,
    items,
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

  async function items() {
    const collection = await my.collection.open();
    const cursor = collection.find(my.query, my.options);
    cursor.batchSize(my.batchSize).project(my.fields);
    if (my.limit) {
      cursor.limit(my.limit);
    }
    return cursor;
  }

  async function toArray() {
    return iterator.toArray(await items());
  }

  async function eachSeries(onItem) {
    return iterator.eachSeries(onItem, await items());
  }

  async function eachLimit(limit, onItem) {
    return iterator.eachLimit(limit, onItem, await items());
  }

  return self;
}
