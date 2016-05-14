var Config    = require('./app/config');
var database  = Config.database;
var Sequelize = require('sequelize');
var sequelize = new Sequelize(database.name, database.user, database.password, {
  host    : database.host,
  dialect : database.engine
});

var Market = sequelize.define('markets', {
  id          : {
    type          : Sequelize.INTEGER,
    autoIncrement : true,
    primaryKey    : true
  },
  api_id      : Sequelize.STRING,
  description : Sequelize.STRING,
  latitude    : Sequelize.DOUBLE,
  longitude   : Sequelize.DOUBLE
});

sequelize
  .sync()
  .then(function() {
    console.log('Works!');
  })
  .catch(function() {
    console.log('Fail!');
  })
;