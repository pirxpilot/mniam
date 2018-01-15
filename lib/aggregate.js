const async = require('async');
const debug = require('debug')('mniam');
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

  function aggregateInCollection(collection, fn) {
    var cursor = collection.aggregate(my.pipeline, my.options);
    fn(null, cursor);
  }

  function toArray(fn) {
    async.waterfall([
      my.collection.open,
      aggregateInCollection,
      iterator.toArray
    ], fn);
  }

  function eachSeries(onItem, fn) {
    async.waterfall([
      my.collection.open,
      aggregateInCollection,
      async.apply(iterator.eachSeries, onItem)
    ], fn);
  }

  function eachLimit(limit, onItem, fn) {
    async.waterfall([
      my.collection.open,
      aggregateInCollection,
      async.apply(iterator.eachLimit, limit, onItem)
    ], fn);
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
  ].forEach(function(name) {
    self[name] = pipelineStep.bind(self, '$' + name);
  });

  return self;
}
