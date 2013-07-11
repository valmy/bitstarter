#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
  var instr = infile.toString();
  if(!fs.existsSync(instr)) {
    return false;
  }
  return instr;
};

var cheerioHtmlFile = function(text) {
  return cheerio.load(text);
};

var loadChecks = function(checksfile) {
  return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(text, checksfile) {
  $ = cheerioHtmlFile(text);
  var checks = loadChecks(checksfile).sort();
  var out = {};
  for(var ii in checks) {
    var present = $(checks[ii]).length > 0;
    out[checks[ii]] = present;
  }
  return out;
};

var clone = function(fn) {
  // Workaround for commander.js issue.
  // http://stackoverflow.com/a/6772648
  return fn.bind({});
};

var assertResourceExist = function(file, cb) {
  var text = assertFileExists(file);
  if (text) {
    cb(undefined, fs.readFileSync(file));
  } else {
    rest.get(file).on('complete', function(result) {
      if (result instanceof Error) {
        cb(result, null);
      } else {
        cb(undefined, result);
      }
    });
  }
};

if (require.main == module) {
  program
    .option('-f, --file <html_file>', 'Path to index.html', null, HTMLFILE_DEFAULT)
    .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
    .parse(process.argv);

  if (!program.checks) {
    console.error('File checks not exist');
    process.exit(1);
  }
  assertResourceExist(program.file, function (err, text) {
    if (err) {
      throw new Error(err);
      process.exit(1);
    }
    var checkJson = checkHtmlFile(text, program.checks);
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
  });
} else {
  exports.checkHtmlFile = checkHtmlFile;
}
