const test = require('node:test');
const database = require('../lib/database');

test('database', async function () {
  const db = database('mongodb://localhost/mniam-test');
  await db.close();
});
