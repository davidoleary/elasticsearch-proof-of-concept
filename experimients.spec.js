var elasticsearch = require('elasticsearch');
const expect = require('chai').expect;

var client = new elasticsearch.Client({
  host: 'https://search-testuploadapp-gjfceqz6ai6pagvih2k6dxnlha.eu-west-2.es.amazonaws.com/',
  //log: 'trace'
});

// NOTES
// this index can be populated bu running `node populatedata.js`
// http://okfnlabs.org/blog/2013/07/01/elasticsearch-query-tutorial.html
// https://dzone.com/articles/23-useful-elasticsearch-example-queries

describe('general elastic experiments', () => {
  it('get all documents in index', (done) => {
    client.search({
      index: 'movies',
      body: {
        "query": {
          "match_all": {}
        }
      }
    }).then(function (body) {
      var hits = body.hits.hits;
      expect(hits.length).to.equal(4);
      done();
    });
  });

  it('get a document in index', (done) => {
    client.search({
      index: 'movies',
      body: {
        "query": {
          "match": { "title": "Rebel Without a Cause" }
        }
      }
    }).then(function (body) {
      var hits = body.hits.hits;
      expect(hits[0]._source.title).to.equal('Rebel Without a Cause');
      done();
    });
  });

  it('get a document in index by exact term (more performant', (done) => {
    client.search({
      index: 'movies',
      body: {
        query: {
          term: { title: "Rebel Without a Cause" }
        }
      }
    }).then(function (body) {
      var hits = body.hits.hits;
      expect(hits[0]._source.title).to.equal('Rebel Without a Cause');
      done();
    });
  });

  it('get multiple documents in index by exact term', (done) => {
    client.search({
      index: 'movies',
      body: {
        query: {
          constant_score: {
            filter: {
              terms: { // !!!! why not term wtf???? 
                title: ["Rebel Without a Cause", "U.S. Marshals"] 
              }
            }
          }
        }
      }
    }).then(function (body) {
      var hits = body.hits.hits;
      expect(hits[0]._source.title).to.equal('Rebel Without a Cause');
      expect(hits[1]._source.title).to.equal('U.S. Marshals');
      done();
    });
  });

  it('get a document matching hybris status', (done) => {
    client.search({
      index: 'products',
      body: {
        "query": {
          "match": { "hybrisApprovalStatus": "AWAITING_IMAGES" }
        }
      }
    }).then(function (body) {
      var hits = body.hits.hits;
      expect(hits[0]._source.productId).to.equal(1198110);
      done();
    });
  });

  it('get a document between ranges option 1', (done) => {
    client.search({
      index: 'products',
      body: {
        query: {
          bool: {
           must: {
              match_all: {},
            },
            filter: {
              range: {
                deliveredDateIntoBusiness: {
                  lt: "2019-02-01",
                  gte: "2011-01-01"
                }
              }
            }
         }
        }
      }
    }).then(function (body) {
      var hits = body.hits.hits;
      expect(hits[0]._source.productId).to.equal(1111111);
      expect(hits[0]._source.description).to.equal('A test');
      expect(hits[1]._source.productId).to.equal(1198110);
      expect(hits[1]._source.description).to.equal('BRODERIE ANGLAISE NEOPRENE TRAINGLE BIKINI TOP');
      done();
    });
  });

  it('get a document between ranges option 2', (done) => {
    client.search({
      index: 'products',
      body: {
        query: {
          bool: {
            must: {
              range: {
                deliveredDateIntoBusiness: {
                  gte: "2014-01-23",
                 lte: "2019-02-25"
                }
              }
            }
          }
        }
      }
    }).then(function (body) {
      var hits = body.hits.hits;
      expect(hits[0]._source.productId).to.equal(1111111);
      expect(hits[0]._source.description).to.equal('A test');
      expect(hits[1]._source.productId).to.equal(1198110);
      expect(hits[1]._source.description).to.equal('BRODERIE ANGLAISE NEOPRENE TRAINGLE BIKINI TOP');
      done();
    });
  });

  it('combined options query all options populated', (done)=> {
    const fromDate = '2011-02-01';
    const toDate = '2019-02-01';
    const productIds = [1198110];

    client.search({
      index: 'products',
      body: {
        "query": {
          "constant_score": {
            "filter": {
              "bool": {
                must: {
                  range: {
                    deliveredDateIntoBusiness: {
                      gte: fromDate,
                      lte: toDate
                    }
                  }
                },
                "should": [
                  { 
                    "terms": { 
                      "productId": productIds 
                    } 
                  },
                  { 
                    "term": { 
                      "hybrisApprovalStatus": 'AWAITING_IMAGES'.toLowerCase()
                  }
                }]
              }
            }
          }
        }
      }
    }).then(function (body) {
      var hits = body.hits.hits;
      expect(hits[0]._source.productId).to.equal(1198110);
      expect(hits[0]._source.description).to.equal('BRODERIE ANGLAISE NEOPRENE TRAINGLE BIKINI TOP');
      expect(hits[1]._source.productId).to.equal(333333);
      expect(hits[1]._source.description).to.equal('A test3');
      done();
    });
  });

  it('combined options query without product id', (done) => {
    const fromDate = '2011-02-01';
    const toDate = '2019-02-01';
    const productIds = [];

    client.search({
      index: 'products',
      body: {
        "query": {
          "constant_score": {
            "filter": {
              "bool": {
                must: {
                  range: {
                    deliveredDateIntoBusiness: {
                      gte: fromDate,
                      lte: toDate
                    }
                  }
                },
                "should": [
                  {
                    "terms": {
                      "productId": productIds
                    }
                  },
                  {
                    "term": {
                      "hybrisApprovalStatus": 'AWAITING_IMAGES'.toLowerCase()
                    }
                  }]
              }
            }
          }
        }
      }
    }).then(function (body) {
      var hits = body.hits.hits;
      expect(hits[0]._source.productId).to.equal(1198110);
      expect(hits[0]._source.description).to.equal('BRODERIE ANGLAISE NEOPRENE TRAINGLE BIKINI TOP');
      expect(hits[1]._source.productId).to.equal(333333);
      expect(hits[1]._source.description).to.equal('A test3');
      done();
    });
  });


  it('combined options query without product id with multiple approval statuses', (done) => {
    const fromDate = '2011-02-01';
    const toDate = '2019-02-01';
    const productIds = [];

    client.search({
      index: 'products',
      body: {
        "query": {
          "constant_score": {
            "filter": {
              "bool": {
                must: {
                  range: {
                    deliveredDateIntoBusiness: {
                      gte: fromDate,
                      lte: toDate
                    }
                  }
                },
                "should": [{
                  "terms": {
                    "productId": productIds
                  }
                },
                {
                  "terms": {
                    "hybrisApprovalStatus": ['AWAITING_IMAGES'.toLowerCase(), 'APPROVED'.toLowerCase()]
                  }
                }]
              }
            }
          }
        }
      }
    }).then(function (body) {
      var hits = body.hits.hits;
      expect(hits[0]._source.productId).to.equal(1111111, );
      expect(hits[0]._source.description).to.equal('A test');
      expect(hits[0]._source.hybrisApprovalStatus).to.equal('APPROVED');
      expect(hits[1]._source.productId).to.equal(1198110);
      expect(hits[1]._source.description).to.equal('BRODERIE ANGLAISE NEOPRENE TRAINGLE BIKINI TOP');
      expect(hits[1]._source.hybrisApprovalStatus).to.equal('AWAITING_IMAGES');
      expect(hits[2]._source.productId).to.equal(333333);
      expect(hits[2]._source.description).to.equal('A test3');
      done();
    });
  });

  it('build combined options query', (done) => {
    const fromDate = '2011-02-01'; // there will alway be a default range
    const toDate = '2019-02-01';
    const productIds = []; // always use an empty product array by default
    const searchStatuses = ['AWAITING_IMAGES'.toLowerCase(), 'APPROVED'.toLowerCase()];

    const searchSettings = {
      index: 'products',
      body: {
        query: {
          constant_score: {
            filter: {
              bool: {
                must: {
                  range: {
                    deliveredDateIntoBusiness: {
                      gte: fromDate,
                      lte: toDate
                    }
                  }
                },
                should: [{
                  terms: {
                    productId: productIds
                  }
                }]
              }
            }
          }
        }
      }
    };

    if (searchStatuses) {
      searchSettings.body.query.constant_score.filter.bool.should.push({
        terms: {
          hybrisApprovalStatus: searchStatuses
        }
      })
    }

    client.search(searchSettings).then(function (body) {
      var hits = body.hits.hits;
      expect(hits[0]._source.productId).to.equal(1111111, );
      expect(hits[0]._source.description).to.equal('A test');
      expect(hits[0]._source.hybrisApprovalStatus).to.equal('APPROVED');
      expect(hits[1]._source.productId).to.equal(1198110);
      expect(hits[1]._source.description).to.equal('BRODERIE ANGLAISE NEOPRENE TRAINGLE BIKINI TOP');
      expect(hits[1]._source.hybrisApprovalStatus).to.equal('AWAITING_IMAGES');
      expect(hits[2]._source.productId).to.equal(333333);
      expect(hits[2]._source.description).to.equal('A test3');
      done();
    });
  });
});




