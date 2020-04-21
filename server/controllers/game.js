const express = require('express'),
	  router = express.Router(),
	  bodyParser = require('body-parser'),
	  game_model = require('../models/game').game,
	  moment = require('moment');;


// MIDDLEWARE
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

// HELPERS
const littlebirds = require('../helpers/littlebirds');

	router.get('/ping', function (req, res) {
		res.status(200).json({message: 'pong'});
	});

	router.post('/launch-game', function (req, res) {
		var water_cards = require('../assets/water_cards.json');

		console.log(water_cards);

		// fs card from json file

		// shuffle water cards
		// shuffle action cards
		// If player.length is < 8 = 3 card player
		// If player.length is > 8 = 4 card player
		// remaining card in draft
		// Calculate water & food level
		// shuffle player order




		let activity = {
			status: 'new',
			timestamp: moment(),
			content: 'The game will start <span>3 secondes</span>'
		}
		littlebirds.broadcast( 'new-activity', req.body.game_token, activity );

		setTimeout(function(){
			activity.content = 'The game will start <span>2 secondes</span>'
			activity.timestamp = moment(),
			littlebirds.broadcast( 'new-activity', req.body.game_token, activity );
		}, 1000);
		setTimeout(function(){
			activity.content = 'The game will start <span>1 seconde</span>'
			activity.timestamp = moment(),
			littlebirds.broadcast( 'new-activity', req.body.game_token, activity );
		}, 2000);


		res.status(200).json({message: 'pong'});
	});

module.exports = {
	"game" : router
};