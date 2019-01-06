const util = require('util');
const { waterfall } = require('async');
const debug = require('debug')('mniam');

const aggregateCursor = require('./aggregate');
const cursor = require('./cursor');
const memo = require('./memo');

module.exports = collection;

function normalizeIndexSpec(indexes) {
  return indexes.map(([ key, options ]) => Object.assign({ key }, options));
}

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
    findOne,
    findOneAndDelete,
    findOneAndReplace,
    findOneAndUpdate,
    insertOne,
    insertMany,
    deleteOne,
    deleteMany,
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
    eachLimit,
    // deprecated aliases
    removeOne: deleteOne,
    removeMany: deleteMany,
  };

  let my = {
    name,
    db,
    indexes: normalizeIndexSpec(indexes),
    options: {},
    batchSize: 100
  };

  function ensureIndex(mongoCollection, fn) {
    debug('Ensuring %d indexes', my.indexes.length);
    mongoCollection.createIndexes(my.indexes, err => fn(err, mongoCollection));
  }

  function doOpen(fn) {
    debug('Opening collection %s', my.name);
    const tasks = [
      my.db.open,
      (mongoDb, fn) => mongoDb.collection(my.name, fn)
    ];
    if (my.indexes.length > 0) {
      tasks.push(ensureIndex);
    }
    waterfall(tasks, function(err, mongoCollection) {
      my.mongoCollection = mongoCollection;
      fn(err, my.mongoCollection);
    });
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

  function findOneAndDelete(query, options, fn) {
    [ options, fn ] = optionsArgs( options, fn );
    debug('findOneAndDelete %j', query);
    waterfall([
      open,
      (collection, fn) => collection.findOneAndDelete(query, options, fn)
    ], function(err, result) {
      fn(err, result && result.value);
    });
  }

  function findOneAndReplace(query, replacement, options, fn) {
    [ options, fn ] = optionsArgs( options, fn );
    debug('findOneAndReplace %j %j', query, replacement);
    waterfall([
      open,
      (collection, fn) => collection.findOneAndReplace(query, replacement, options, fn)
    ], function(err, result) {
      fn(err, result && result.value);
    });
  }

  function findOneAndUpdate(query, update, options, fn) {
    [ options, fn ] = optionsArgs( options, fn );
    debug('findOneAndUpdate %j %j', query, update);
     options = Object.assign({
      returnOriginal: false
    }, options);
    waterfall([
      open,
      (collection, fn) => collection.findOneAndUpdate(query, update, options, fn)
    ], function(err, result) {
      fn(err, result && result.value);
    });
  }

  function findOne(q, fn) {
    debug('findOne %j', q);
    waterfall([
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
    waterfall([
      open,
      (collection, fn) => collection.insertOne(doc, my.options, fn),
      ({ ops }, fn) => fn(null, ops[0])
    ], fn);
  }

  function insertMany(docs, fn) {
    waterfall([
      open,
      (collection, fn) => collection.insertMany(docs, my.options, fn),
      ({ ops }, fn) => fn(null, ops)
    ], fn);
  }

  function deleteOne(filter, fn) {
    waterfall([
      open,
      (collection, fn) => collection.deleteOne(filter, my.options, fn)
    ], fn);
  }

  function deleteMany(filter, fn) {
    waterfall([
      open,
      (collection, fn) => collection.deleteMany(filter, my.options, fn)
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
    waterfall([
      open,
      (collection, fn) => collection.updateOne(filter, data,  options, fn)
    ], err => fn(err));
  }

  function updateMany(filter, data, options, fn) {
    [ options, fn ] = optionsArgs( options, fn );
    waterfall([
      open,
      (collection, fn) => collection.updateMany(filter, data, options, fn)
    ], err => fn(err));
  }

  function replaceOne(filter, data, options, fn) {
    [ options, fn ] = optionsArgs( options, fn );
    debug('replaceOne %j %j', filter, data);
    waterfall([
      open,
      (collection, fn) => collection.replaceOne(filter, data,  options, fn),
      ({ ops }, fn) => fn(null, ops[0])
    ], fn);
  }

  function bulkWrite(operations, options, fn) {
    [ options, fn ] = optionsArgs( options, fn );
    debug('bulkWrite %d', operations.length);
    waterfall([
      open,
      (collection, fn) => collection.bulkWrite(operations, options, fn)
    ], fn);
  }

  function drop(fn) {
    debug('drop %s', my.name);
    waterfall([
      open,
      (collection, fn) => collection.drop(fn)
    ], fn);
  }

  function indexInformation(fn) {
    my.mongoCollection.indexInformation(fn);
  }

  return self;
}
