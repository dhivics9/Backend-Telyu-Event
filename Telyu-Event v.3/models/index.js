const Sequelize = require('sequelize');
const sequelize = new Sequelize(process.env.DB_URI, {
  dialect: 'mysql',
  logging: false,
});

const User = require('./user')(sequelize, Sequelize.DataTypes);
const Event = require('./event')(sequelize, Sequelize.DataTypes);
const Registration = require('./registration')(sequelize, Sequelize.DataTypes);

const db = {
  User,
  Event,
  Registration,
  Sequelize,
};

// Add associations if necessary
if (db.User.associate) db.User.associate(db);
if (db.Event.associate) db.Event.associate(db);
if (db.Registration.associate) db.Registration.associate(db);

module.exports = db;
