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
var DEFAULT_DATE_FORMAT = 'DDMMYYYY';

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
    return moment.tz(property, DEFAULT_DATE_FORMAT, DEFAULT_TZ).toDate();
  }

  function insert(str, index, value) {
    return str.substr(0, index) + value + str.substr(index);
  }
};

var convertRow = module.exports.convertRow = function convertRow(row, formats){
  var obj = {};
  var hasSections = formats[0].sectionType != undefined;
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
      var sectionValue = getValue(format);
      if (sectionValue == section.sectionType){
        returnFormats = section.formats;
        return false;
      }
    });
    if (!returnFormats)
      throw new Error('Section identifier for a row, is invalid. See the row: (' + row + ')');
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
      try{
        if (data == "" || !data){
          cb(); //skip blank lines
          return;
        }
        var newData = convertRow(data, formats);  
        cb(null, newData);
      }catch(err){
        cb(err, null);
      }
    }))
};

module.exports.setDateFormat = function (format){
  DEFAULT_DATE_FORMAT = format;
}

module.exports.generateEDI = (format, data) => {
  var result = '';
  Object.keys(data).forEach((key, index) => {
    var type = key;
    interpretType(type, data[key]);
    if (index < Object.keys(data).length - 1)
      addValue('\n');
  });
  return result;

  function interpretType(type, data){
    if (Object.keys(format).indexOf(type) == -1)
      throw new Error('Type "' + type  + '"" not found');
    var formatRules = format[type];
    var count = 0;
    data.forEach((row) => {
      count++;
      console.log('ROW', row);
      addValue(formatRow(type, row, formatRules));
      if (count < data.length){
        console.log('add new line');
        addValue('\n')
      }
    });
  }

  function addValue(row){
    result += row;
  }

  function formatRow(type, row, formatRule){
    var formatedRow = type;
    formatRule.forEach((rule) => {
      if (Object.keys(row).indexOf(rule.name) == -1)
        return;
      formatedRow += formatValue(row[rule.name], rule);
    });
    return formatedRow;
  }

  function formatValue(value, rule){
    switch (rule.type){
      case FORMAT.TEXT:
        return formatText(value, rule);
        break;
      case FORMAT.NUMBER:
        return formatNumber(value, rule);
        break;
      case FORMAT.FLOAT:
        return formatFloat(value, rule);
        break;
      case FORMAT.DATE:
        return formatDate(value, rule);
        break;
      default:
        throw new TypeError("formatProperty(): Type invalid - " + type);
        break;
    }
  }

  function formatFloat(value, rule){
    value = value.toFixed(2) * 100;
    var zero = "0";
    var zeros = rule.len - (""+value).length;
    if (zeros > 0)
      value =  Array(zeros + 1).join(zero) + value;
    return value;
  }

  function formatNumber(value, rule){
    var zero = "0";
    console.log('nUMBER', value);
    var zeros = rule.len - (""+value).length;
    if (zeros > 0)
      value =  Array(zeros + 1).join(zero) + value;
    return value;
  }

  var dateFormat = 'DDMMYY';
  function formatDate(value, rule){
    return moment(value).format('DDMMYY');
  }

  function formatText(value, rule){
    var len = rule.len - (""+value).length;
    if (len > 0)
      value = value + Array(len + 1).join(" ");
    return value;
  }
}