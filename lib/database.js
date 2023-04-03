const mongo = require('mongodb');
const debug = require('debug')('mniam');

const makeCollection = require('./collection');

module.exports = database;

/**
 * Lazily creates database connections: takes the same parameters as MongoClient.connect
 *
 * @param url {String} mongo DB URL
 * @param opts {Object} hash of server, db and replSet options overwriting defaults from DB URL
 */
function database(url, opts = {}) {
  let my;
  let openPromise = doOpen();
  opts = { useNewUrlParser: true, useUnifiedTopology: true, ...opts };

  const self = {
    open,
    close,
    collection,
    drop
  };

  async function doOpen() {
    debug('Connecting: %s', url);
    const client = await mongo.MongoClient.connect(url, opts);
    const db = await client.db();
    return { client, db };
  }

  async function open() {
    if (!openPromise) {
      openPromise = doOpen();
    }
    if (!my) {
      debug('Opening DB...');
      my = await openPromise;
    }
    return my.db;
  }

  async function close() {
    if (openPromise) {
      debug('Waiting until connected...');
      await open();
    }
    if (my) {
      debug('Closing DB...');
      const { client } = my;
      my = undefined;
      openPromise = undefined;
      await client.close();
    }
  }

  function collection(options) {
    options.db = self;
    return makeCollection(options);
  }

  async function drop() {
    const db = await open();
    return db.dropDatabase();
  }

  return self;
}
