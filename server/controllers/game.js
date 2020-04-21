const express = require('express'),
	  router = express.Router(),
	  bodyParser = require('body-parser'),
	  moment = require('moment');

//MODEL
const game_model = require('../models/game').game;

// MIDDLEWARE
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

// HELPERS
const littlebirds = require('../helpers/littlebirds'),
	  game_helper = require('../helpers/game_helper');

	router.get('/ping', function (req, res) {
		res.status(200).json({message: 'pong'});
	});

	router.post('/launch-game', function (req, res) {
		let water_cards = require('../assets/water_cards.json'),
			action_cards = require('../assets/action_cards.json'),
			all_player,
			activity = {
				status: 'new',
			};

		game_helper.shuffle_water_cards( water_cards )
			.then(shuffled_card => {
				return game_model.update_water_cards( req.body.game_token, shuffled_card );
			})
			.then(are_water_cards_updated => {
				return game_model.get_all_players( req.body.game_token );
			})
			.then(players => {
				all_player = players;
				return game_helper.shuffle_action_cards( action_cards, all_player.length );
			})
			.then(shuffled_action_card => {
				for (var i = all_player.length - 1; i >= 0; i--) {
					let player_id = 'player_' + i;
					all_player[i].game_detail.cards = shuffled_action_card[player_id]
				}

				return game_model.update_action_cards( req.body.game_token, shuffled_action_card.draft );
			})
			.then(are_action_cards_updated => {
				return game_helper.shuffle_player_order( all_player );
			})
			.then(players => {
				return game_model.update_all_players( req.body.game_token, players );
			})
			.then(are_players_updated => {
				return game_helper.manage_ration_level( all_player.length );
			})
			.then(rations => {
				return game_model.update_rations( req.body.game_token, rations );
			})
			.then(are_rations_updated => {
				activity.content = 'The game will start <span>3 secondes</span>';
				activity.timestamp = moment();
				littlebirds.broadcast( 'new-activity', req.body.game_token, activity );

				setTimeout(function(){
					activity.content = 'The game will start <span>2 secondes</span>'
					activity.timestamp = moment(),
					littlebirds.broadcast( 'new-activity', req.body.game_token, activity );
				}, 2000);
				setTimeout(function(){
					activity.content = 'The game will start <span>1 seconde</span>'
					activity.timestamp = moment(),
					littlebirds.broadcast( 'new-activity', req.body.game_token, activity );
				}, 4000);

				res.status(200).json({message: 'pong'});
			})
			.catch( error => {
				console.log(error);
				res.status(401).json( error );
			})		
	});

module.exports = {
	"game" : router
};