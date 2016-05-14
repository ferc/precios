const Config    = require('./config');
const Sequelize = require('sequelize');
const api       = Config.api;
const https     = require('https');

function Scraper(sequelize) {
  this.sequelize = sequelize;
};

Scraper.prototype.fillMarkets = function() {
  var Market = this.sequelize.define('markets', {
    id          : {
      type          : Sequelize.INTEGER,
      autoIncrement : true,
      primaryKey    : true
    },
    address     : Sequelize.STRING,
    api_id      : Sequelize.STRING,
    description : Sequelize.STRING,
    latitude    : Sequelize.DOUBLE,
    longitude   : Sequelize.DOUBLE
  }, {
    timestamps : false
  });

  function next(offset) {
    https.get(api.base + api.markets.url + '?limit=' + api.markets.limit + '&offset=' + offset, (res) => {
      var body = '';

      res.setEncoding('utf8');

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        var markets;

        body = JSON.parse(body);

        markets = body.sucursales.map((market) => {
          return {
            api_id      : market.id,
            address     : market.direccion,
            description : market.banderaDescripcion,
            latitude    : market.lat,
            longitude   : market.lng
          };
        });

        Market.bulkCreate(markets, {
          ignoreDuplicates  : true,
          validate          : true,
          updateOnDuplicate : true
        }).then(() => {
          offset += api.markets.limit;
          if ( body.total > offset ) {
            next(offset);
          }
        }).catch((errors) => {
          console.warn(errors);
        });
      });
    });
  };

  next(0);
};

Scraper.prototype.fillPrices = function() {
  //
};

module.exports = Scraper;