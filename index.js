var moment = require('moment-timezone');
var fs = require('fs');
var readline = require('readline');
var es = require('event-stream');

const FORMAT = module.exports.FORMAT = {
  TEXT: 1,
  NUMBER: 2,
  FLOAT: 3,
  DATE: 4,
};

const DEFAULT_TZ = 'America/Sao_Paulo';

var formatValue = module.exports.formatValue = function formatValue(type, value){
  switch (type){
    case FORMAT.TEXT:
      return formatText(value);
      break;
    case FORMAT.NUMBER:
      return formatNumber(value);
      break;
    case FORMAT.FLOAT:
      return formatFloat(value);
      break;
    case FORMAT.DATE:
      return formatDate(value);
      break;
    default:
      throw new TypeError("formatProperty(): Type invalid - " + type);
      break;
  }

  function formatText(property){
    return property.trim();
  }

  function formatNumber(property){
    return +property;
  }

  function formatFloat(property){
    var decimalPosition = property.length - 2;
    return +insert(property, decimalPosition, '.');
  }

  function formatDate(property){
    return moment.tz(property, 'DDMMYYYY', DEFAULT_TZ).toDate();
  }

  function insert(str, index, value) {
    return str.substr(0, index) + value + str.substr(index);
  }
};

var convertRow = module.exports.convertRow = function convertRow(row, formats){
  var obj = {};
  var hasSections = formats[0].sectionType;
  if (hasSections){
    formats = getFormats();
  }
  formats.forEach(function (format) {
    var value = getValue(format);
    obj[format.name] = value;
  });

  return obj;

  function getFormats(){
    var sections = formats;
    var returnFormats;
    sections.forEach(function (section) {
      var format = section.formats[0];
      if (getValue(format) == section.sectionType){

        returnFormats = section.formats;
        return false;
      }
    });
    return returnFormats;
  }

  function getValue(format) {
    var value = row.slice(format.init - 1, format.init - 1 + format.len);
    value = formatValue(format.type, value);
    return value;
  }
};

module.exports.readStream = function (stream, formats) {
  return stream
    .pipe(es.split())
    .pipe(es.map(function (data, cb) {
      var newData = convertRow(data, formats);
      cb(null, newData);
    }))
};

