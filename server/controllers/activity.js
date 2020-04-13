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
	  io_activity_helper = require('../helpers/io_activity_helper');

	router.get('/ping', function (req, res) {
		res.status(200).json({message: 'pong'});
	});

	router.get('/create-lobby', function (req, res) {
		let game = {
			 game_token: token_manager.create_code()
		}

		game_model(game).save(function(error, result) {
			if(error) {
				return res.status(400).json(error);
			}else{
				res.status(200).json( game.game_token );
			}
		});
	});

	router.post('/delete-lobby', function (req, res) {
		game_model.remove_game( req.body.game_token )
			.then(is_game_removed => {
				io_activity_helper.broadcast('leave-game', req.body.game_token, {});
				res.status(200).json({ message: 'lobby deleted' });
			})
			.catch( error => {
				res.status(401).json( error );
			})
	})

	router.post('/add-player', function (req, res) {
		let player = {
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
				if( is_name_unique == true ){
					return game_model.add_player( req.body.game_token, player )
				}else{
					throw { message: 'This name is already taken.' }
				}
			})
			.then(is_new_player_added => {
				return game_model.get_all_players( req.body.game_token )
			})
			.then(players => {
				res.status(200).json({ player_id: players[(players.length - 1)]._id });
				io_activity_helper.broadcast('update-player', req.body.game_token, {type:'add-player', player_details: players[(players.length - 1)]})
			})
			.catch( error => {
				res.status(401).json( error );
			})
	});

	router.post('/remove-player', function (req, res) {
		if( req.body.kicked_out == true ){ // If the player as been kicked out by the admin then emit the kicked out screen
			io_activity_helper.broadcast('leave-game', req.body.player_id, {});
		}

		let activity = {};

		game_model.get_a_player( req.body.game_token, req.body.player_id )
			.then(player => {
				activity.author_id = req.body.player_id,
				activity.content = '<span>' + player.name + '</span> left the lobby.'

				return game_model.remove_player( req.body.game_token, req.body.player_id )
			})
			.then(is_new_player_removed => {
				io_activity_helper.broadcast('update-player', req.body.game_token, {type:'remove-player', player_id: req.body.player_id });
				return game_model.add_activity( req.body.game_token, activity );
			})
			.then(is_activity_added => {
				io_activity_helper.broadcast( 'new-activity', req.body.game_token, activity );
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

module.exports = {
	"activity" : router
};