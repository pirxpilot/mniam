var async = require('async');
var debug = require('debug')('mniam');
var iterator = require('./iterator');

module.exports = cursor;

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


  function toArray(fn) {
    async.waterfall([
      my.collection.open,
      findInCollection,
      iterator.toArray
    ], fn);
  }

  function eachSeries(onItem, fn) {
    async.waterfall([
      my.collection.open,
      findInCollection,
      async.apply(iterator.eachSeries, onItem)
    ], fn);
  }

  function eachLimit(limit, onItem, fn) {
    async.waterfall([
      my.collection.open,
      findInCollection,
      async.apply(iterator.eachLimit, limit, onItem)
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
