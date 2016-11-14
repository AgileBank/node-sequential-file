var moment = require('moment-timezone');

var chai = require('chai');
var should = chai.should();

var sequential = require('./index');
var FORMAT = sequential.FORMAT;

describe('Sequential Data Formatting', function () {

  afterEach('Setup default Date Format', function(){
    sequential.setDateFormat('DDMMYYYY');
  });

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

  it('Custom Date Formatting', function () {
    sequential.setDateFormat('YYMMDD')
    sequential.formatValue(FORMAT.DATE, '890421').toISOString().should.be
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

describe('Convert sample', function () {
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


describe('Writer', () => {
  var sampleDate;
  var sampleFormat;
  var sampleData;
  var expectedResult;

  beforeEach('Init vars', () => {
    sampleDate = moment('20160201', 'YYYYMMDD').toDate();
    sampleFormat = {  
      '1': [
        {name: 'id', init: 1, len: 3, type: FORMAT.NUMBER},
        {name: 'date', init: 4, len: 8, type: FORMAT.DATE},
        {name: 'name', init: 11, len: 30, type: FORMAT.TEXT}
      ],
      '2': [
        {name: 'id', init: 1, len: 3, type: FORMAT.TEXT},
        {name: 'n', init: 4, len: 8, type: FORMAT.NUMBER}
      ]
    };
    sampleData = {
      '1': [
        {id: 10, date: sampleDate, name: 'CONTELE SOLUCOES TECNOLOGICAS'}
      ],
      '2': [
        {id: 20, n: 7777777},
        {id: 30, n: 1},
      ]
    };
    expectedResult = '1010010216CONTELE SOLUCOES TECNOLOGICAS \n' +
      '220 07777777\n' +
      '230 00000001';
  });  

  it('Should throw error, because of a non identified type', () => {
    //None sampleFormat
    sampleFormat = {};
    (() => {
      sequential.generateEDI(sampleFormat, sampleData);
    }).should.throw(Error)
  });

  it('Should write objects to EDI', () => {
    var EDI = sequential.generateEDI(sampleFormat, sampleData);
    EDI.should.be.equal(expectedResult);
  });
  it('Shoudl work FLOAT', () => {
    sampleFormat = {
      "7": [
        {"name": "02.7", "init": 002, "len": 11, "type": FORMAT.FLOAT}
      ]
    };

    sampleData =  {
      '7': [
        {
          '02.7': 35.00
        }
      ]
    };
    var EDI = sequential.generateEDI(sampleFormat, sampleData);
    EDI.should.be.equal('700000003500');
  });
  it.only('Shoudl work BIGINT', () => {
    sampleFormat = {
      "7": [
        {"name": "02.7", "init": 002, "len": 17, "type": FORMAT.NUMBER}
      ]
    };

    sampleData =  {
      '7': [
        {
          '02.7': '15903110009005029'
        }
      ]
    };
    var EDI = sequential.generateEDI(sampleFormat, sampleData);
    EDI.should.be.equal('715903110009005029');
  });

  it('Shoudl work SAMPLE 2', () => {
    sampleFormat = {
      "7": [
          {"name": "02.7", "init":  2, "len":  2, "type": FORMAT.NUMBER},
          {"name": "03.7", "init":  4, "len": 14, "type": FORMAT.NUMBER},
          {"name": "04.7", "init": 18, "len":  4, "type": FORMAT.NUMBER},
          {"name": "05.7", "init": 22, "len":  1, "type": FORMAT.TEXT},
          {"name": "06.7", "init": 23, "len":  8, "type": FORMAT.NUMBER},
          {"name": "07.7", "init": 31, "len":  1, "type": FORMAT.TEXT},
          {"name": "08.7", "init": 32, "len":  7, "type": FORMAT.NUMBER},
          {"name": "09.7", "init": 39, "len": 25, "type": FORMAT.TEXT}
      ]
    };
    console.log("SAMPLÃO", sampleFormat);

    sampleData =  {
      '7': [
        {
          '02.7': '02',
          '03.7': '06036246000108',
          '04.7': '2896',
          '05.7': '7',
          '06.7': '31581',
          '07.7': '8',
          '08.7': '2944287',
          '09.7': 'TODO'
        }
      ]
    };
    var EDI = sequential.generateEDI(sampleFormat, sampleData);
    EDI.should.be.equal('70206036246000108289670003158182944287TODO                     ');
  });
});