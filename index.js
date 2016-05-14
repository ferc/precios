const Scraper   = require('./app/scraper');
const Config    = require('./app/config');
const Sequelize = require('sequelize');
const database  = Config.database;

var sequelize = new Sequelize(database.name, database.user, database.password, {
  host    : database.host,
  dialect : database.engine
});
var scraper   = new Scraper(sequelize);

sequelize.sync().then(function() {
  scraper.fillMarkets()
    .then(scraper.fillPrices.bind(scraper))
    .then(() => {
      console.log('Scraped!');
    })
  ;
});