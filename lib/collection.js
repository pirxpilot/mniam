import Debug from 'debug';
import aggregateCursor from './aggregate.js';
import cursor from './cursor.js';

const debug = Debug('mniam');

function normalizeIndexSpec(indexes) {
  return indexes.map(([key, options]) => Object.assign({ key }, options));
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
export default function collection({ db, name, indexes = [] }) {
  const self = {
    aggregate,
    bulkWrite,
    distinct,
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
    watch
  };

  const my = {
    name,
    db,
    indexes: normalizeIndexSpec(indexes),
    options: {},
    batchSize: 100
  };

  let state = {};

  async function doOpen() {
    debug('Opening collection %s', my.name);
    const mongoDb = await my.db.open();
    const mongoCollection = await mongoDb.collection(my.name);
    if (my.indexes.length > 0) {
      debug('Ensuring %d indexes', my.indexes.length);
      await mongoCollection.createIndexes(my.indexes);
    }
    return mongoCollection;
  }

  async function open() {
    if (!state.promise) {
      state.promise = doOpen();
    }
    if (!state.collection) {
      state.collection = await state.promise;
    }
    return state.collection;
  }

  function close() {
    debug('Closing collection %s', my.name);
    state = {};
  }

  function query(q = {}) {
    return cursor({ collection: self }).query(q);
  }

  function aggregate(pipeline = [], options = {}) {
    return aggregateCursor({ collection: self }).pipeline(pipeline).options(options);
  }

  function find(q, fields, options = {}) {
    debug('find %j %j %j', query, fields, options);
    return query(q).fields(fields).options(options).batchSize(my.batchSize).toArray();
  }

  function forEach(onItem) {
    debug('forEach');
    return query().batchSize(my.batchSize).eachSeries(onItem);
  }

  // similar to forEach but processes items in packets up to `limit` size
  function eachLimit(limit, onItem) {
    debug('each with limit %d', limit);
    return query().batchSize(my.batchSize).eachLimit(limit, onItem);
  }

  async function findOneAndDelete(query, options = {}) {
    debug('findOneAndDelete %j', query);
    const collection = await open();
    return collection.findOneAndDelete(query, options);
  }

  async function findOneAndReplace(query, replacement, options = {}) {
    debug('findOneAndReplace %j %j', query, replacement);
    const collection = await open();
    return collection.findOneAndReplace(query, replacement, options);
  }

  async function findOneAndUpdate(query, update, options = {}) {
    debug('findOneAndUpdate %j %j', query, update);
    options = {
      returnDocument: 'after',
      ...options
    };
    const collection = await open();
    return await collection.findOneAndUpdate(query, update, options);
  }

  async function findOne(query, options = {}) {
    debug('findOne %j', query);
    const collection = await open();
    return collection.findOne(query, options);
  }

  function options(o) {
    Object.assign(my.options, o);
    return self;
  }

  async function insertOne(doc) {
    const collection = await open();
    const r = await collection.insertOne(doc, my.options);
    doc._id = r.insertedId;
    return doc;
  }

  async function insertMany(docs) {
    const collection = await open();
    const { insertedIds } = await collection.insertMany(docs, my.options);
    return insertedIds;
  }

  async function deleteOne(filter) {
    const collection = await open();
    return collection.deleteOne(filter, my.options);
  }

  async function deleteMany(filter) {
    const collection = await open();
    return collection.deleteMany(filter, my.options);
  }

  async function updateOne(filter, data, options) {
    const collection = await open();
    return collection.updateOne(filter, data, options);
  }

  async function updateMany(filter, data, options) {
    const collection = await open();
    return collection.updateMany(filter, data, options);
  }

  async function replaceOne(filter, data, options) {
    debug('replaceOne %j %j', filter, data);
    const collection = await open();
    const { upsertedId } = await collection.replaceOne(filter, data, options);
    if (upsertedId) {
      data._id = upsertedId;
    }
    return data;
  }

  async function bulkWrite(operations, options) {
    debug('bulkWrite %d', operations.length);
    const collection = await open();
    return collection.bulkWrite(operations, options);
  }

  async function distinct(key, query) {
    const collection = await open();
    return collection.distinct(key, query);
  }

  async function drop() {
    debug('drop %s', my.name);
    const collection = await open();
    return collection.drop();
  }

  async function indexInformation() {
    const collection = await open();
    return collection.indexInformation();
  }

  async function watch(pipeline, options) {
    const collection = await open();
    return collection.watch(pipeline, options);
  }

  return self;
}
