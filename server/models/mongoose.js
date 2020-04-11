var mongoose = require('mongoose'),
	config = require('../config'),
	mongoDB = config.database;

	mongoose.connect(mongoDB, {
		useUnifiedTopology: true,
		useNewUrlParser: true,
	});
	mongoose.Promise = global.Promise;
	var db = mongoose.connection;

	db.on('error', console.error.bind(console, 'Mongoose error:'));
	db.on('connecting', function () {console.log('Mongoose connecting')});
	db.on('connected', function () {console.log('Mongoose connected')});
	db.on('open', function () {console.log('Mongoose open')});

module.exports={
    mongoose,
    "DB":db,
    "Schema" : mongoose.Schema
}