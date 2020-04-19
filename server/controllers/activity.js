const express = require('express'),
	  router = express.Router(),
	  bodyParser = require('body-parser'),
	  game_model = require('../models/game').game;


// MIDDLEWARE
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

// HELPERS
const token_manager = require('../helpers/token_manager'),
	  activity_helper = require('../helpers/activity_helper'),
	  littlebirds = require('../helpers/littlebirds');

	router.get('/ping', function (req, res) {
		res.status(200).json({message: 'pong'});
	});

	router.get('/create-lobby', function (req, res) {
		let activity = {
				content: 'The <span>lobby</span> was created.'
			},
			game = {
				game_token: token_manager.create_code()
			};

		game_model(game).save(function(error, result) {
			if(error) {
				return res.status(400).json(error);
			}else{
				game_model.add_activity( game.game_token, activity )
					.then(is_activity_added => {
						res.status(200).json( game.game_token );
					})
					.catch( error => {
						res.status(401).json( error );
					});
			}
		});
	});

	router.post('/delete-lobby', function (req, res) {
		game_model.remove_game( req.body.game_token )
			.then(is_game_removed => {
				littlebirds.broadcast('leave-game', req.body.game_token, {});
				res.status(200).json({ message: 'lobby deleted' });
			})
			.catch( error => {
				res.status(401).json( error );
			})
	})

	router.post('/add-player', function (req, res) {
		let activity = {},
			player = {
				name: req.body.player_name,
				rank: 'player'
			
			};

		game_model.get_all_players( req.body.game_token )
			.then(players => {
				if( players.length == 0 ){
					player.rank = 'administrator';
				}
				return activity_helper.check_if_name_unique(players, player.name);
			})
			.then(is_name_unique => {
				if( is_name_unique ){
					return game_model.add_player( req.body.game_token, player )
				}else{
					throw { message: 'This name is already taken.' }
				}
			})
			.then(is_new_player_added => {
				return game_model.get_all_players( req.body.game_token )
			})
			.then(players => {
				player = players[(players.length - 1)];
				activity.author_id = player._id;
				activity.content = '<span>' + player.name + '</span> joined the lobby.';
				littlebirds.broadcast('update-player', req.body.game_token, {type:'add-player', player_details: player})
				return game_model.add_activity( req.body.game_token, activity );
			})
			.then(is_activity_added => {
				activity.status = 'new';
				littlebirds.broadcast('new-activity', req.body.game_token, activity);
				res.status(200).json({ player_id: player._id });

			})
			.catch( error => {
				console.log(error);
				res.status(401).json( error );
			})
	});

	router.post('/remove-player', function (req, res) {
		let message = 'left the lobby.'
		if( req.body.kicked_out == true ){ // If the player as been kicked out by the admin then emit the kicked out screen
			littlebirds.broadcast('leave-game', req.body.player_id, {});
			message = 'was kicked out of the lobby.'
		}

		let activity = {};

		game_model.get_a_player( req.body.game_token, req.body.player_id )
			.then(player => {
				activity.author_id = req.body.player_id,
				activity.content = '<span>' + player.name + '</span> ' + message

				return game_model.remove_player( req.body.game_token, req.body.player_id )
			})
			.then(is_new_player_removed => {
				littlebirds.broadcast('update-player', req.body.game_token, {type:'remove-player', player_id: req.body.player_id });
				return game_model.add_activity( req.body.game_token, activity );
			})
			.then(is_activity_added => {
				activity.status = 'new';
				littlebirds.broadcast( 'new-activity', req.body.game_token, activity );
				res.status(200).json({ message: 'player removed' });
			})
			.catch( error => {
				res.status(401).json( error );
			})
	});

	router.post('/get-all-players-details', function (req, res) {
		game_model.get_all_players( req.body.game_token )
			.then(players_details => {
				res.status(200).json( players_details );
			})
	});

	router.post('/get-last-50-activities', function (req, res) {
		game_model.get_last_activities( req.body.game_token, 50 )
			.then(last_50_activities => {
				res.status(200).json( last_50_activities );
			})
	});

	router.get('/get-cron-running', function (req, res) {
		littlebirds.all_active_cron()
			.then(all_active_cron => {
				res.status(200).json( all_active_cron );
			})
	});

module.exports = {
	"activity" : router
};