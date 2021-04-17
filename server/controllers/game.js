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

				delete_old_game(); // here we check is there is any game older than 24h and delete it.
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

	router.post('/get-current-water-card', function (req, res) {
		game_model.get_current_water_card( req.body.game_token )
			.then(water_card => {
				res.status(200).json(water_card);
			})
			.catch( error => {
				console.log(error);
				res.status(401).json( error );
			})
	})

	router.post('/get-water', function (req, res) {
		let current_player,
		    multiplicateur = 1,
			current_water_card,
			current_game_states,
			activity = {};

		game_model.get_a_player( req.body.game_token, req.body.player_id ) 
			.then(player => {
				current_player = player;
				if( player.game_detail.bonus.square_water ){ multiplicateur = 2 } // Check if the current player has a water multiplicator 
				return game_model.get_current_water_card( req.body.game_token );
			})
			.then(water_card => { // Get the current water state
				current_water_card = water_card;
				return game_model.get_game_states( req.body.game_token );
			})
			.then(game_states => { // Get the current games state
				current_game_states = game_states;

				// update game states
				current_game_states.water_level = current_game_states.water_level + (current_water_card.water_level * multiplicateur);

				// create activity content
				activity.content = '<span>' + current_player.name + '</span> found ' + (current_water_card.water_level * multiplicateur) + ' unit(s) of water.';

				return game_model.update_game_states( req.body.game_token, current_game_states );
			})
			.then(are_game_states_updated => { // Update game states
				return game_model.add_activity( req.body.game_token, activity );
			})
			.then(is_activity_added => { // Broadcast activity
				activity.status = 'new';
				littlebirds.broadcast('new-activity', req.body.game_token, activity);
				littlebirds.broadcast('update-game-states', req.body.game_token, current_game_states);

				return next_turn( req.body.game_token, current_game_states );
			})
			.then(is_turn_updated => {
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

				// create activity content
				activity.content = '<span>' + current_player.name + '</span> found ' + food_total + ' unit(s) of food (' + food_nb_string + ' )';

				return game_model.update_game_states( req.body.game_token, game_states );
			})
			.then(are_game_states_updated => {
				littlebirds.broadcast('update-game-states', req.body.game_token, game_states);
				return game_model.add_activity( req.body.game_token, activity );
			})
			.then(is_activity_added => {
				activity.status = 'new';
				littlebirds.broadcast('new-activity', req.body.game_token, activity);

				return next_turn( req.body.game_token, game_states );
			})
			.then(is_turn_updated => {
				res.status(200).json({content: 'player got food'});
			})
			.catch( error => {
				console.log(error);
				res.status(401).json( error );
			})
	})

	router.post('/get-wood', function (req, res) {
		let wood_array = [0, 0, 0, 0, 0, 1],
			random_wood_array = [],
			is_player_bitten_by_a_snake = false,
			current_player,
			multiplicator = 1,
			snake_card = {
				name: "Sick",
				illustration: "maladie.jpg"
			},
			activity = {},
			game_states = {};

		for (var i = 0; i < req.body.more_wood; i++) {
			random_wood_array.push(wood_array[Math.floor(Math.random() * wood_array.length)]);
			wood_array.splice(wood_array.indexOf(random_wood_array[i]), 1);
		}

		is_player_bitten_by_a_snake = random_wood_array.includes(1);

		game_model.get_a_player( req.body.game_token, req.body.player_id )
			.then(player => {
				current_player = player;

				if( player.game_detail.bonus.square_wood ){
					multiplicator = 2;
				}
				if( is_player_bitten_by_a_snake ){
					littlebirds.broadcast('new-action-card', player._id, snake_card);
					littlebirds.broadcast('update_player_game_status', req.body.game_token, {player_id: req.body.player_id, status: 'sick'});
					activity.content = '<span>' + current_player.name + '</span> found ' + multiplicator + ' unit of wood but got bitten by a snake!';
					return game_model.update_player_game_status( req.body.game_token, req.body.player_id, 'sick' );
				}else{
					activity.content = '<span>' + current_player.name + '</span> found ' + (random_wood_array.length + multiplicator) + ' unit of wood and avoid the snakes!';
				}
			})
			.then(is_game_status_updated => {
				return game_model.add_activity( req.body.game_token, activity );
			})
			.then(is_activity_added => {
				activity.status = 'new';
				littlebirds.broadcast('new-activity', req.body.game_token, activity);

				return game_model.get_game_states( req.body.game_token );
			})
			.then(temp_game_states => {
				game_states = temp_game_states;
				if( is_player_bitten_by_a_snake ){
					game_states.wood_level = game_states.wood_level + multiplicator;
				}else{
					game_states.wood_level = game_states.wood_level + (random_wood_array.length + multiplicator);
				}
				littlebirds.broadcast('update-game-states', req.body.game_token, game_states);
				return game_model.update_game_states( req.body.game_token, game_states );
			})
			.then(are_game_states_updated => {				
				return update_raft_status( req.body.game_token, game_states );
			})
			.then(new_game_states => {
				return next_turn( req.body.game_token, new_game_states );
			})
			.then(is_turn_updated => {
				res.status(200).json({content: 'player got wood'});
			})
			.catch( error => {
				console.log(error);
				res.status(401).json( error );
			})
	})

	router.post('/get-card', function (req, res) {
		let new_card = {},
			current_player = {},
			activity = {},
			game_states = {};

		game_model.get_next_action_card( req.body.game_token )
			.then(action_card => {
				new_card = action_card;
				return game_model.get_a_player( req.body.game_token, req.body.player_id );
			})
			.then(player => {
				current_player = player;
				current_player.game_detail.cards.push(new_card);
				littlebirds.broadcast('new-action-card', player._id.toString(), new_card);
				littlebirds.broadcast('update_player_cards', req.body.game_token, {player_id: req.body.player_id, cards: current_player.game_detail.cards});
				return game_model.update_player_cards( req.body.game_token, req.body.player_id, current_player.game_detail.cards );
			})
			.then(are_cards_updated => {
				activity.content = '<span>' + current_player.name + '</span> got a card from the rack';
				return game_model.add_activity( req.body.game_token, activity );
			})
			.then(is_activity_added => {
				activity.status = 'new';
				littlebirds.broadcast('new-activity', req.body.game_token, activity);

				return game_model.delete_last_action_card( req.body.game_token );
			})
			.then(is_action_card_deleted => {
				return game_model.get_game_states( req.body.game_token );
			})
			.then(temp_game_states => {
				game_states = temp_game_states;
				return game_model.update_game_states( req.body.game_token, game_states );
			})
			.then(are_game_states_updated => {
				return next_turn( req.body.game_token, game_states );
			})
			.then(is_turn_updated => {
				res.status(200).json({content: 'player got card'});
			})
			.catch( error => {
				console.log(error);
				res.status(401).json( error );
			})
	})

	function next_turn( game_token, current_game_states ){
		return new Promise((resolve, reject)=>{
			let is_next_round,
				activity = {},
				game_states = current_game_states;

			game_model.get_all_players( game_token )
				.then( players => {
					if( game_states.turn / (players.length - 1) == 1 ){
						game_states.turn = 0
					}else{
						game_states.turn ++;
					}
					return game_model.get_next_player( game_token, game_states.turn );
				})
				.then(next_player => {
					game_states.active_player = next_player._id;
					activity.content = 'It\'s <span>' + next_player.name + '</span>turn to play.'; // create activity content

					return game_model.update_game_states( game_token, game_states );
				})
				.then(are_game_states_updated => { // Update game states
					littlebirds.broadcast('new-toast', game_states.active_player, {content: "It's your turn to play!"});
					littlebirds.broadcast('update_active_player', game_token, {player_id: game_states.active_player});

					return game_model.add_activity( game_token, activity );
				})
				.then(is_activity_added => {
					activity.status = 'new';
					setTimeout(function(){
						littlebirds.broadcast('new-activity', game_token, activity);
					}, 1000);
					resolve(true);
				})

		});
	}

	function update_raft_status( game_token ){
		return new Promise((resolve, reject)=>{
			let game_states = {},
				send_new_activity = true,
				activity = {};

			game_model.get_game_states( game_token )
				.then(temp_game_states => {
					switch( temp_game_states.wood_level / 5 ){
						case 0.2:
						case 0.4:
						case 0.6:
						case 0.8:
							send_new_activity = false;
							break;
						case 1:
						case 1.2:
						case 1.4:
						case 1.6:
						case 1.8:
							activity.content = '<span>5 of woods</span> where converted into 1 rack';
							temp_game_states.wood_level = temp_game_states.wood_level - 5;
							temp_game_states.raft_level = temp_game_states.raft_level + 1; 
							break;
						case 2:
						case 2.2:
						case 2.4:
						case 2.6:
						case 2.8:
							activity.content = '<span>10 of woods</span> where converted into 2 rack';
							temp_game_states.wood_level = temp_game_states.wood_level - 10;
							temp_game_states.raft_level = temp_game_states.raft_level + 2; 
							break;
						default:
							break;
					}
					game_states = temp_game_states;

					console.log( game_token, game_states );
					return game_model.update_game_states( game_token, game_states );
				})
				.then(are_game_states_updated => {
					console.log( are_game_states_updated );
					littlebirds.broadcast('update-game-states', game_token, game_states);

					if( send_new_activity ){
						console.log('send_new_activity ' + send_new_activity);
						return game_model.add_activity( game_token, activity );
					}else{
						console.log('alex');
						resolve( game_states );
					}
				})
				.then(is_activity_added => {
					activity.status = 'new';
					littlebirds.broadcast('new-activity', game_token, activity);
					resolve( game_states );
				})
			});
	}

	router.post('/update-card-visibility', function (req, res) {
		let activity = {};
		let card_to_update = {
			player_id: req.body.player_id,
			card_id: req.body.card_id,
			card_visibility: req.body.card_visibility
		}

		game_model.get_a_player( req.body.game_token, req.body.player_id )
			.then(player => {
				let card_name;

				for (var i = player.game_detail.cards.length - 1; i >= 0; i--) {
					if(player.game_detail.cards[i]._id == req.body.card_id){
						player.game_detail.cards[i].visibility = req.body.card_visibility;
						card_name = player.game_detail.cards[i].name;
					}
				}

				if(req.body.card_visibility == 'visible'){
					activity.content = '<span>' + player.name + '</span> show one of his card: ' + card_name;
				}else{
					activity.content = '<span>' + player.name + '</span> hide one of his card: ' + card_name;
				}
				return game_model.update_player_cards( req.body.game_token, req.body.player_id, player.game_detail.cards );
			})
			.then(are_cards_updated => {
				return game_model.add_activity( req.body.game_token, activity );
			})
			.then(is_activity_added => {
				activity.status = 'new';
				littlebirds.broadcast('new-activity', req.body.game_token, activity);
				littlebirds.broadcast('update-card-visibility', req.body.game_token, card_to_update );
				res.status(200).json({content: 'card visibility was updated'});
			})
			.catch( error => {
				console.log(error);
				res.status(401).json( error );
			})
	});

function launch_vote(){
	//broadcast to every ppl the time to vote + the number of voter to do
}

function get_vote(){

}

function delete_old_game(){
	game_model.get_all_games()
		.then(games => {
			for (var i = games.length - 1; i >= 0; i--) {
				if( moment( games[i].creation_date).isAfter( moment().subtract(24, 'hours')) == false ){
					game_model.delete_old_game( games[i].game_token );
				}
			}
		})
}

module.exports = {
	"game" : router
};