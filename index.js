import database from './lib/database.js';

export default database;

export { ObjectId, Timestamp } from 'mongodb';
export { default as collection } from './lib/collection.js';
export { default as objectID } from './lib/object-id.js';
export { database as db };
