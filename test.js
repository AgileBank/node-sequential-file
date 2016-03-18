var moment = require('moment-timezone');

var chai = require('chai');
chai.should();

var sequential = require('./index');
var FORMAT = sequential.FORMAT;

describe('Sequential Data Formatting', function () {

  it('Text Formatting', function () {
    sequential.formatValue(FORMAT.TEXT, 'FOOBAR       ').should.be.eq('FOOBAR');
  });

  it('Number Formatting', function () {
    sequential.formatValue(FORMAT.NUMBER, '432').should.be.eq(432);
  });

  it('Float Formatting', function () {
    sequential.formatValue(FORMAT.FLOAT, '199').should.be.eq(1.99);
  });

  it('Date Formatting', function () {
    sequential.formatValue(FORMAT.DATE, '21041989').toISOString().should.be
      .eq(moment('21041989', 'DDMMYYYY').toDate().toISOString());
  });
});

describe('Convert Rows into Objects', function () {
  it('Should understand columns', function () {
    var row = sequential.convertRow('00121041989', [
      {name: 'id', init: 1, len: 3, type: FORMAT.NUMBER},
      {name: 'date', init: 4, len: 8, type: FORMAT.DATE}
    ]);
    row.should.be.an('object');
    row.should.have.property('id', 1);
    row.should.have.property('date');
    row.date.toISOString().should.be.eq(moment('21041989', 'DDMMYYYY').toDate().toISOString());
  });
  it('Should understand columns within sections', function () {
    var row = sequential.convertRow('00121041989', [
      {
        sectionType: 1, //Value of first item in formats - commonly used to specify sections in Brazil
        formats: [
          {name: 'id', init: 1, len: 3, type: FORMAT.NUMBER},
          {name: 'date', init: 4, len: 8, type: FORMAT.DATE}
        ]
      }, {
        sectionType: 2, //Value of first item in formats - commonly used to specify sections in Brazil
        formats: [
          {name: 'id', init: 1, len: 3, type: FORMAT.TEXT},
          {name: 'date', init: 4, len: 8, type: FORMAT.NUMBER}
        ]
      }
    ]);
    row.should.be.an('object');
    row.should.have.property('id', 1);
    row.should.have.property('date');
    row.date.toISOString().should.be.eq(moment('21041989', 'DDMMYYYY').toDate().toISOString());
  });
});

describe('Convert Sample', function () {
  it('Should convert', function (done) {
    var formats = [
      {
        sectionType: 1,
        formats: [
          {name: 'id', init: 1, len: 2, type: FORMAT.NUMBER},
          {name: 'date', init: 3, len: 8, type: FORMAT.DATE},
          {name: 'description', init: 11, len: 20, type: FORMAT.TEXT}
        ]
      }
    ];
    var fs = require('fs');
    var stream = fs.createReadStream('./sample.txt');
    var st = sequential.readStream(stream, formats);
    var items = [];
    st.on('data', function (chunk) {
      items.push(chunk);
    });
    st.on('end', function () {
      items.should.be.instanceof(Array);
      items.should.have.length(2);
      done();
    });
  });
});