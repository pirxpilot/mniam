import test from 'node:test';
import database from '../index.js';

test('database', async () => {
  const db = database('mongodb://localhost/mniam-test');
  await db.close();
});
