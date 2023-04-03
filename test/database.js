const test = require('tape');

const database = require('../lib/database');


test('database', async function (t) {

  const db = database('mongodb://localhost/mniam-test');
  await db.close();
  t.comment('database closed');
});
