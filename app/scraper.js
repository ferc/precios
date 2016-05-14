const Config    = require('./config');
const Sequelize = require('sequelize');
const api       = Config.api;
const https     = require('https');

function callAPI(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      var body = '';

      res.setEncoding('utf8');

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        body = JSON.parse(body);

        resolve(body);
      });
    });
  });
};

function markerMapper(market) {
  return {
    api_id      : market.id,
    address     : market.direccion,
    description : market.banderaDescripcion,
    latitude    : market.lat,
    longitude   : market.lng
  };
};

function productMapper(product) {
  return {
    api_id : product.id,
    brand  : product.marca || '',
    model  : product.presentacion || '',
    name   : product.nombre || ''
  };
};

function Scraper(sequelize) {
  this.sequelize = sequelize;

  this.Market = this.sequelize.define('markets', {
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

  this.Price   = this.sequelize.define('prices', {
    id         : {
      type          : Sequelize.BIGINT,
      autoIncrement : true,
      primaryKey    : true
    },
    market_id  : Sequelize.INTEGER,
    product_id : Sequelize.INTEGER,
    date       : Sequelize.DATE,
    price      : Sequelize.FLOAT
  }, {
    timestamps : false
  })

  this.Product = this.sequelize.define('products', {
    id          : {
      type          : Sequelize.INTEGER,
      autoIncrement : true,
      primaryKey    : true
    },
    api_id      : Sequelize.STRING,
    brand       : Sequelize.STRING,
    category_id : Sequelize.INTEGER,
    model       : Sequelize.STRING,
    name        : Sequelize.STRING
  }, {
    timestamps : false
  });
};

Scraper.prototype.fillMarkets = function() {
  var instance = this;

  return new Promise((resolve, reject) => {
    function next(offset) {
      callAPI(api.base + api.markets.url + '?limit=' + api.markets.limit + '&offset=' + offset).then((body) => {
        var markets = body.sucursales.map(markerMapper);

        instance.Market.bulkCreate(markets, {
          ignoreDuplicates  : true,
          validate          : true,
          updateOnDuplicate : ['address', 'description', 'latitude', 'longitude']
        }).then(() => {
          offset += api.markets.limit;

          if ( body.total > offset ) {
            next(offset);
          }
          else {
            resolve();
          }
        }).catch((errors) => {
          console.log(errors);
          reject();
        });
      });
    };

    next(2250);
  });
};

Scraper.prototype.fillPrices = function() {
  var instance = this;

  return new Promise((resolve, reject) => {
    var markets;

    function nextMarket(index) {
      return new Promise((resolve, reject) =>  {
        walkProducts(markets[index]).then(() => {
            index++;

            if ( markets.length <= index) {
              resolve();
            }
            else {
              return nextMarket(index + 1);
            }
          })
        ;
      });
    };

    function walkProducts(market) {
      return new Promise((resolve, reject) => {
        function nextProducts(market, offset) {
          callAPI(api.base + api.products.url + '?id_sucursal=' + market.api_id + '&limit=' + api.products.limit + '&offset=' + offset).then((body) => {
            var products = body.productos.map(productMapper);

            instance.Product.bulkCreate(products, {
              ignoreDuplicates  : true,
              validate          : true,
              updateOnDuplicate : ['brand', 'category_id', 'model', 'name']
            }).then(() => {
              var apiIDs = body.productos.map((product) => {
                return product.id;
              });

              return instance.Product.findAll({
                where : {
                  api_id : apiIDs
                }
              });
            }).then((productModels) => {
              var prices = body.productos.map((product, index) => {
                var model = productModels.filter((model) => {
                  return product.id === model.api_id;
                })[0];

                return {
                  market_id  : market.id,
                  product_id : model.id,
                  date       : new Date(),
                  price      : product.precio
                };
              });

              return instance.Price.bulkCreate(prices, {
                ignoreDuplicates  : true,
                validate          : true,
                updateOnDuplicate : ['price']
              })
            }).then(() => {
              offset += api.markets.limit;
              if ( body.total > offset ) {
                nextProducts(market, offset);
              }
              else {
                resolve();
              }
            }).catch((errors) => {
              console.log(errors);
              reject();
            });
          });
        };

        nextProducts(market, 0);
      });
    };


    instance.Market.findAll({ attributes : ['id', 'api_id'] }).then((result) => {
      markets = result;

      return nextMarket(0);
    });
  });
};

module.exports = Scraper;