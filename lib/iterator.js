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
      await parallelLimit(items, onItem, limit);
    }
  } finally {
    cursor.close();
  }

  async function parallelLimit(items, onItem, limit) {
    const queue = new Array(limit).fill(Promise.resolve());
    let i = 0;
    await Promise.all(queue.map(next));

    function next(p) {
      if (i >= items.length) {
        return p;
      }
      const item = items[i++];
      return p.then(() => next(onItem(item)));
    }
  }
}
