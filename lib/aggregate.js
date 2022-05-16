const iterator = require('./iterator');

module.exports = aggregate;

function aggregate({ collection }) {
  let self = {
    options,
    pipeline,
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

  async function toArray() {
    const collection = await my.collection.open();
    const cursor = collection.aggregate(my.pipeline, my.options);
    return iterator.toArray(cursor);
  }

  async function eachSeries(onItem) {
    const collection = await my.collection.open();
    const cursor = collection.aggregate(my.pipeline, my.options);
    return iterator.eachSeries(onItem, cursor);
  }

  async function eachLimit(limit, onItem) {
    const collection = await my.collection.open();
    const cursor = collection.aggregate(my.pipeline, my.options);
    return iterator.eachLimit(limit, onItem, cursor);
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
