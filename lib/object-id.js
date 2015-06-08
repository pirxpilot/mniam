var ObjectID = require('mongodb').ObjectID;

module.exports = objectID;

function objectID(id) {
	return new ObjectID(id);
}
