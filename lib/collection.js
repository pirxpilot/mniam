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
    geoNear,
    findOne,
    findAndModify,
    insertOne,
    insertMany,
    removeOne,
    removeMany,
    updateOne,
    updateMany,
    remove,
    query,
    indexInformation,
    open,
    close,
    drop,
    options,
    // deprecated - use insertOne|Many
    save,
    // deprecate - used updateOne|May
    update,
    // deprecated - use mniam.objectID
    objectID: require('./object-id'),
    // deprecated: use query().batchSize(), query().find() etc.
    batchSize,
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
      collection.ensureIndex(index[0], index[1], fn);
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

  function findAndModify(query, update, fn) {
    debug('update %s', query);
    if (query instanceof ObjectID || typeof query === 'string') {
      query = { _id: query };
    }
    async.waterfall([
      open,
      (collection, fn) => collection.findAndModify(query, [['_id', 'asc']], update, { 'new': true }, fn)
    ], function(err, result) {
      fn(err, result && result.value);
    });
  }

  function findOne(query, fn) {
    debug('findOne %j', query);
    async.waterfall([
      open,
      function(collection, fn) {
        self.find(query, undefined, undefined, function(err, items) {
          if(err) { return fn(err); }
          err = items.length > 0 ? null : 'no items found' + util.inspect(query);
          fn(err, items[0]);
        });
      }
    ], fn);
  }

  function remove(query, fn) {
    debug('remove %j', query);
    async.waterfall([
      open,
      (collection, fn) => collection.remove(query, fn)
    ], fn);
  }

  function save(item, fn) {
    debug('save %j', item);
    async.waterfall([
      open,
      function(collection, fn) {
        collection.save(item, { safe: true }, function(err) {
          if(err) { return fn(err); }
          fn(null, item);
        });
      }
    ], fn);
  }

  function update(query, data, options, fn) {
    debug('update %s', query);
    if (query instanceof ObjectID || typeof query === 'string') {
      query = { _id: query };
    }
    if (typeof fn === 'undefined') {
      fn = options;
      options = { upsert: true };
    }
    async.waterfall([
      open,
      (collection, fn) => collection.update(query, data, options, fn)
    ], fn);
  }

  function options(o) {
    Object.assign(my.options, o);
    return self;
  }

  function insertOne(doc, fn) {
    async.waterfall([
      open,
      (collection, fn) => collection.insertOne(doc, my.options, fn)
    ], fn);
  }

  function insertMany(docs, fn) {
    async.waterfall([
      open,
      (collection, fn) => collection.insertMany(docs, my.options, fn)
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
      return [ options, my.options ];
    }
    return [ Object.assign({}, my.options, options) , fn ];
  }

  function updateOne(filter, data, options, fn) {
    [ options, fn ] = optionsArgs( options, fn );
    async.waterfall([
      open,
      (collection, fn) => collection.updateOne(filter, data,  options, fn)
    ], fn);
  }

  function updateMany(filter, data, options, fn) {
    [ options, fn ] = optionsArgs( options, fn );
    async.waterfall([
      open,
      (collection, fn) => collection.updateMany(filter, data, options, fn)
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
