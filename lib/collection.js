const util = require('util');
const async = require('async');
const ObjectID = require('mongodb').ObjectID;
const debug = require('debug')('mniam');

const aggregateCursor = require('./aggregate');
const cursor = require('./cursor');
const memo = require('./memo');

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

function collection({ db, name, indexes = [] }) {
  let self = {
    aggregate,
    bulkWrite,
    geoNear,
    findOne,
    findOneAndUpdate,
    insertOne,
    insertMany,
    removeOne,
    removeMany,
    updateOne,
    updateMany,
    replaceOne,
    query,
    indexInformation,
    open,
    close,
    drop,
    options,
    find,
    forEach,
    eachLimit
  };

  let my = {
    name,
    db,
    indexes,
    options: {},
    batchSize: 100
  };

  function ensureIndex(collection, fn) {
    debug('Ensuring %d indexes', my.indexes.length);
    async.forEach(my.indexes, function(index, fn) {
      collection.createIndex(index[0], index[1], fn);
    }, fn);
  }

  function doOpen(fn) {
    debug('Opening collection %s', my.name);
    async.waterfall([
      my.db.open,
      (mongoDb, fn) => mongoDb.collection(my.name, fn),
      function(mongoCollection, fn) {
        my.mongoCollection = mongoCollection;
        ensureIndex(mongoCollection, fn);
      }
    ], err => fn(err, my.mongoCollection));
  }

  function open(fn) {
    if(!my.open) {
      my.open = memo(doOpen);
    }
    my.open(fn);
  }

  function close() {
    if (!my.open) {
      debug('Ignoring close for %s', my.name);
      return;
    }
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
      (collection, fn) => collection.geoNear(ll[0], ll[1], options, fn)
    ], fn);
  }

  function query(q) {
    return cursor({ collection: self }).query(q || {});
  }

  function aggregate(pipeline, options) {
    return aggregateCursor({ collection: self }).pipeline(pipeline || []).options({} || options);
  }

  function find(q, fields, options, fn) {
    debug('find %j %j %j', query, fields, options);
    query(q).fields(fields).options(options).batchSize(my.batchSize).toArray(fn);
  }

  function forEach(onItem, fn) {
    debug('forEach');
    query().batchSize(my.batchSize).eachSeries(onItem, fn);
  }

  // similar to forEach but processes items in packets up to `limit` size
  function eachLimit(limit, onItem, fn) {
    debug('each with limit %d', limit);
    query().batchSize(my.batchSize).eachLimit(limit, onItem, fn);
  }

  function findOneAndUpdate(query, update, options, fn) {
    [ options, fn ] = optionsArgs( options, fn );
    options = Object.assign({
      returnOriginal: false,
      sort: [['_id', 'asc']]
    }, options);
    debug('findOneAndUpdate %j %j', query, update, options);
    async.waterfall([
      open,
      (collection, fn) => collection.findOneAndUpdate(query, update, options, fn)
    ], function(err, result) {
      fn(err, result && result.value);
    });
  }

  function findOne(q, fn) {
    debug('findOne %j', q);
    async.waterfall([
      open,
      function(collection, fn) {
        query(q).limit(1).toArray(function(err, items) {
          if(err) { return fn(err); }
          err = items.length > 0 ? null : 'no items found' + util.inspect(query);
          fn(err, items[0]);
        });
      }
    ], fn);
  }

  function options(o) {
    Object.assign(my.options, o);
    return self;
  }

  function insertOne(doc, fn) {
    async.waterfall([
      open,
      (collection, fn) => collection.insertOne(doc, my.options, fn),
      ({ ops }, fn) => fn(null, ops[0])
    ], fn);
  }

  function insertMany(docs, fn) {
    async.waterfall([
      open,
      (collection, fn) => collection.insertMany(docs, my.options, fn),
      ({ ops }, fn) => fn(null, ops)
    ], fn);
  }

  function removeOne(filter, fn) {
    async.waterfall([
      open,
      (collection, fn) => collection.removeOne(filter, my.options, fn)
    ], fn);
  }

  function removeMany(filter, fn) {
    async.waterfall([
      open,
      (collection, fn) => collection.removeMany(filter, my.options, fn)
    ], fn);
  }

  function optionsArgs(options, fn) {
    if (typeof options === 'function') {
      return [ my.options, options ];
    }
    return [ Object.assign({}, my.options, options) , fn ];
  }

  function updateOne(filter, data, options, fn) {
    [ options, fn ] = optionsArgs( options, fn );
    async.waterfall([
      open,
      (collection, fn) => collection.updateOne(filter, data,  options, fn)
    ], err => fn(err));
  }

  function updateMany(filter, data, options, fn) {
    [ options, fn ] = optionsArgs( options, fn );
    async.waterfall([
      open,
      (collection, fn) => collection.updateMany(filter, data, options, fn)
    ], err => fn(err));
  }

  function replaceOne(filter, data, options, fn) {
    [ options, fn ] = optionsArgs( options, fn );
    debug('replaceOne %j %j', filter, data);
    async.waterfall([
      open,
      (collection, fn) => collection.replaceOne(filter, data,  options, fn),
      ({ ops }, fn) => fn(null, ops[0])
    ], fn);
  }

  function bulkWrite(operations, options, fn) {
    [ options, fn ] = optionsArgs( options, fn );
    debug('bulkWrite %d', operations.length);
    async.waterfall([
      open,
      (collection, fn) => collection.bulkWrite(operations, options, fn)
    ], fn);
  }

  function drop(fn) {
    debug('drop %s', my.name);
    async.waterfall([
      open,
      (collection, fn) => collection.drop(fn)
    ], fn);
  }

  function indexInformation(fn) {
    my.mongoCollection.indexInformation(fn);
  }

  return self;
}
