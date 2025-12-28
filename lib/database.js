import Debug from 'debug';
import mongo from 'mongodb';
import makeCollection from './collection.js';

const debug = Debug('mniam');

/**
 * Lazily creates database connections: takes the same parameters as MongoClient.connect
 *
 * @param url {String} mongo DB URL
 * @param opts {Object} hash of server, db and replSet options overwriting defaults from DB URL
 */
export default function database(url, opts = {}) {
  let my;
  let openPromise = doOpen();

  const self = {
    open,
    close,
    command,
    collection,
    startSession,
    refreshSession,
    drop
  };

  async function doOpen() {
    debug('Connecting: %s', url);
    const client = await mongo.MongoClient.connect(url, opts);
    const db = client.db();
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

  function startSession() {
    return my.client.startSession();
  }

  function command(...args) {
    return my.db.command(...args);
  }

  function refreshSession(session) {
    return command({ refreshSessions: [session.id] });
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
