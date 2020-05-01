
2.1.1 / 2020-05-01
==================

 * upgrade async to ~3
 * replace mongo/should with tape
 * add `useUnifiedTopology` flag for DB connection
 * fix iterator.eachLimit
 * fix findOneAndUpdate test

2.1.0 / 2019-01-06
==================

 * rename removeOne/All to deleteOneAll
 * add findOneAndReplace and findOneAndDelete collection methods

2.0.2 / 2018-12-31
==================

 * use createIndexes to streamline collection opening

2.0.1 / 2018-12-31
==================

 * remove unsupported geoNear function

2.0.0 / 2018-12-25
==================

 * upgrade dependencies
 * upgrade monggodb driver to ~3
 * add `replaceOne`
 * replace `findAndModify` with `findOneAndUpdate`
 * remove deprecated: `remove`, `save`, `update`

1.10.0 / 2018-03-11
===================

 * add basic support for `collection.bulkWrite`

1.9.0 / 2018-03-03
==================

 * add memo util and use it for collection and database open

1.8.1 / 2018-02-02
==================

 * fix: allow `close()` for collections that were not open

1.8.0 / 2018-01-15
==================

 * add modern CRUD methods to collection
 * update code to ES6

1.7.2 / 2017-09-30
==================

 * allow query as a parameter for findAndModify

1.7.1 / 2017-07-16
==================

 * pass query in addition to id to the update() method

1.7.0 / 2017-03-26
==================

 * add aggreate() method to collection

1.6.2 / 2017-02-19
==================

 * transfer repo to pirxpilot
 * update node version in travis config

1.6.1 / 2016-07-13
==================

 * update dependencies

1.6.0 / 2016-04-18
==================

 * add fluent iteration API for collections

1.5.0 / 2016-04-17
==================

 * add database.drop and collection.drop

1.4.0 / 2016-04-14
==================

 * add collection.eachLimit functions

1.3.2 / 2015-07-28
==================

 * optimize objectID creation
 * fix collection.find - get results before closing the cursor

1.3.1 / 2015-07-27
==================

 * close MongoDB cursors in find and forEach

1.3.0 / 2015-06-07
==================

 * expose mniam.objectID, deprecate db.objectID and collection.objectID

1.2.0 / 2015-06-07
==================

 * update mongodb driver to 2.x
 * update async ~0 -> ~1
 * update mocha and should to the latest version

1.1.0 / 2014-11-16
==================

 * add collection.batchSize

1.0.0 / 2014-05-25
==================

 * travis: test on node 0.10
 * use 'should' in tests
 * simplify Makefile
 * relax debug version dependency

0.3.0 / 2013-09-14 
==================

 * Use debug module
 * Use MongoClient connect

0.2.0 / 2013-08-29 
==================

 * Update dependencies
 * Add dependency status badge to Readme
 * Add nmp version badge from badge.fury.io

0.0.2 / 2012-12-17 
==================

  * MongoDB driver updates - write concern option

0.0.1 / 2012-12-17 
==================

  * Add basic collection tests
  * Add db.collection API
  * Implement database and collection objects
  * Initial commit
