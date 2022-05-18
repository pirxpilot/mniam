const iterator = require('./iterator');

module.exports = aggregate;

function aggregate({ collection }) {
  let self = {
    options,
    pipeline,
    items,
    toArray,
    eachLimit,
    eachSeries
  };

  var my = {
    collection,
    options: {},
    pipeline: []
  };

  function pipeline(p) {
    my.pipeline = p;
    return self;
  }

  function options(o) {
    my.options = o;
    return self;
  }

  function pipelineStep(operation, options) {
    var stage = {};
    stage[operation] = options;
    my.pipeline.push(stage);
    return self;
  }

  async function items() {
    const collection = await my.collection.open();
    return collection.aggregate(my.pipeline, my.options);
  }

  async function toArray() {
    return iterator.toArray(await items());
  }

  async function eachSeries(onItem) {
    return iterator.eachSeries(onItem, await items());
  }

  async function eachLimit(limit, onItem) {
    return iterator.eachLimit(limit, onItem, await items());
  }

  [
    'addFields',
    'bucket',
    'bucketAuto',
    'collStats',
    'count',
    'facet',
    'geoNear',
    'graphLookup',
    'group',
    'indexStats',
    'limit',
    'lookup',
    'match',
    'out',
    'project',
    'redact',
    'replaceRoot',
    'sample',
    'skip',
    'sort',
    'sortByCount',
    'unwind'
  ].forEach(function (name) {
    self[name] = pipelineStep.bind(self, '$' + name);
  });

  return self;
}
