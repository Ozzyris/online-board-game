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
			},
			game_states = {
				turn: 0,
				water_level: 0,
				food_level: 0,
				wood_level: 0,
				raft_level: 0,
				dead_level: 0,
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
				return game_helper.manage_game_states_level( all_player.length );
			})
			.then(new_game_states => {
				game_states.food_level = new_game_states.food_level;
				game_states.water_level = new_game_states.food_level;
				return game_model.update_game_states( req.body.game_token, game_states );
			})
			.then(are_game_states_updated => {
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
				setTimeout(function(){
					littlebirds.broadcast( 'launch-game', req.body.game_token, {} );
				}, 6000);

				res.status(200).json({message: 'pong'});
			})
			.catch( error => {
				console.log(error);
				res.status(401).json( error );
			})		
	});

	router.post('/get-game-states', function (req, res) {
		game_model.get_game_states( req.body.game_token )
			.then(game_states => {
				res.status(200).json(game_states);
			})
			.catch( error => {
				console.log(error);
				res.status(401).json( error );
			})
	})

	router.post('/get-water', function (req, res) {
		let multiplicateur = 1,
			game_states = {},
			activity = {},
			current_player;

		game_model.get_a_player( req.body.game_token, req.body.player_id )
			.then(player => {
				current_player = player;
				if( player.game_detail.bonus.square_water ){ multiplicateur = 2}
				return game_model.get_game_states( req.body.game_token );
			})
			.then(temp_game_states => {
				game_states = temp_game_states;
				game_model.get_a_water_card( req.body.game_token, 0 )
				return game_model.get_a_water_card( req.body.game_token, game_states.turn );
			})
			.then(water_card => {
				game_states.water_level = game_states.water_level + (water_card.water_level * multiplicateur);
				game_states.turn ++;
				activity.content = '<span>' + current_player.name + '</span> found ' + (water_card.water_level * multiplicateur) + ' unit(s) of water.';
				return game_model.add_activity( req.body.game_token, activity );
			})
			.then(is_activity_added => {
				activity.status = 'new';
				littlebirds.broadcast('new-activity', req.body.game_token, activity);
				littlebirds.broadcast('update-game-states', req.body.game_token, game_states);
				return game_model.update_game_states( req.body.game_token, game_states );
			})
			.then(are_game_states_updated => {
				return game_model.get_next_player( req.body.game_token, game_states.turn );
			})
			.then(player => {
				activity.content = 'It\'s <span>' + player.name + '</span>turn to play.';
				delete activity.status; 
				littlebirds.broadcast('new-toast', player._id, {content: "It's your turn to play!"});
				littlebirds.broadcast('current_player', req.body.game_token, {player_id: player._id});
				return game_model.add_activity( req.body.game_token, activity );
			})
			.then(is_activity_added => {
				activity.status = 'new';
				setTimeout(function(){
					littlebirds.broadcast('new-activity', req.body.game_token, activity);
				}, 1000);
				res.status(200).json({content: 'player got water'});
			})
			.catch( error => {
				console.log(error);
				res.status(401).json( error );
			})
	})

	router.post('/get-food', function (req, res) {
		let fish_array = [1, 1, 1, 2, 2, 3],
			random_fish_balls = [],
			current_player,
			game_states = {},
			activity = {};

		game_model.get_a_player( req.body.game_token, req.body.player_id )
			.then(player => {
				current_player = player;
				random_fish_balls.push(fish_array[Math.floor(Math.random() * fish_array.length)]);
				
				if( player.game_detail.bonus.square_food ){
					fish_array.splice(fish_array.indexOf(random_fish_balls[0]), 1);
					random_fish_balls.push(fish_array[Math.floor(Math.random() * fish_array.length)]);
				}
				return game_model.get_game_states( req.body.game_token );
			})
			.then(temp_game_states => {
				game_states = temp_game_states;
				let food_total = 0,
					food_nb_string = '';
				for (var i = random_fish_balls.length - 1; i >= 0; i--) {
					game_states.food_level = game_states.food_level + random_fish_balls[i];
					food_nb_string += ' ' + random_fish_balls[i] + ' +';
					food_total += random_fish_balls[i];
				}
				food_nb_string = food_nb_string.substring(0, (food_nb_string.length - 2));
				activity.content = '<span>' + current_player.name + '</span> found ' + food_total + ' unit(s) of food (' + food_nb_string + ' )';
				game_states.turn ++;
				return game_model.add_activity( req.body.game_token, activity );
			})
			.then(is_activity_added => {
				activity.status = 'new';
				littlebirds.broadcast('new-activity', req.body.game_token, activity);
				littlebirds.broadcast('update-game-states', req.body.game_token, game_states);
				return game_model.update_game_states( req.body.game_token, game_states );
			})
			.then(are_game_states_updated => {
				return game_model.get_next_player( req.body.game_token, game_states.turn );
			})
			.then(player => {
				activity.content = 'It\'s <span>' + player.name + '</span>turn to play.';
				delete activity.status; 
				littlebirds.broadcast('new-toast', player._id, {content: "It's your turn to play!"});
				littlebirds.broadcast('current_player', req.body.game_token, {player_id: player._id});
				return game_model.add_activity( req.body.game_token, activity );
			})
			.then(is_activity_added => {
				activity.status = 'new';
				setTimeout(function(){
					littlebirds.broadcast('new-activity', req.body.game_token, activity);
				}, 1000);
				res.status(200).json({content: 'player got food'});
			})
			.catch( error => {
				console.log(error);
				res.status(401).json( error );
			})
	})

	router.post('/get-card', function (req, res) {
		let new_card = {};

		game_model.get_next_action_card( req.body.game_token )
			.then(action_card => {
				new_card = action_card;
				console.log( action_card );
				return game_model.get_a_player( req.body.game_token, req.body.player_id );
			})
			.then(player => {
				littlebirds.broadcast('new-action-card', player._id, new_card);
			})
		// Get next card of the draft
		// -> Emit new card to our player
		// Add this card to our player
		// -> Broadcast new updated player to the room
		// -> Add activity
		// Delete this card from the draft
		// Launch next turn

		res.status(200).json({content: 'player got card'});

	})

module.exports = {
	"game" : router
};