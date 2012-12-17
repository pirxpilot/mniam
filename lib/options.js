var url = require('url');

module.exports = parseDbUrl;

function parseDbUrl(dburl) {
  var options = {},
    parsed;

  // console.log(dburl);
  parsed = url.parse(dburl);
  options.port = parseInt(parsed.port || 27017, 10);
  options.dbname = parsed.pathname.split('/')[1];
  options.host = parsed.hostname;
  if (parsed.auth) {
    options.username = parsed.auth.split(':')[0];
    options.password = parsed.auth.split(':')[1];
  }
  // console.log(options);

  return options;
}