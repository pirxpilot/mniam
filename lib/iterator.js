import parallelLimit from 'run-each-limit/promises';

export async function toArray(cursor) {
  try {
    return await cursor.toArray();
  } finally {
    cursor.close();
  }
}

export async function eachSeries(onItem, cursor) {
  try {
    while (await cursor.hasNext()) {
      const items = cursor.readBufferedDocuments();
      for (const item of items) {
        await onItem(item);
      }
    }
  } finally {
    cursor.close();
  }
}

export async function eachLimit(limit, onItem, cursor) {
  try {
    while (await cursor.hasNext()) {
      const items = cursor.readBufferedDocuments();
      await parallelLimit(items, limit, onItem);
    }
  } finally {
    cursor.close();
  }
}
