var mongoose = require("./mongoose"),
	moment = require('moment'),
	Promise = require('bluebird');

var game = new mongoose.Schema({
	creation_date: {type: Date, default: () => moment()},
	game_token: {type: String},
	players: [
		{
			name: {type: String},
			creation_date: {type: Date, default: () => moment()},
			status: {type: String, default: 'offline'}, //[ "online", "inactive", "offline"]
			last_online_time: {type: Date},
			rank: {type: String, default: 'player'}, //[ "administrator", "player"]
			game_detail: {
				status: {type: String, default: 'alive'}, //[ "alive", "sick", "dead"]
				position: {type: Number},
				cards: [
					{
						name: {type: String},
						position: {type: Number},
						illustration: {type: String},
						visibility: {type: String, default: 'hidden'}, //[ "visiblie", "hidden"]
						usage_number: {type: String}, //[ "0", "1", "infinity"]
						usage_left: {type: String}, //[ "0", 1", "infinity"]
						game_set: {type: String,}, //[ "base_game", extention_1"]
						function: {type: String},
					}
				],
				bonus: {
					square_food: {type: Boolean, default: false},
					square_water: {type: Boolean, default: false},
					square_wood: {type: Boolean, default: false},
					square_vote: {type: Boolean, default: false},
				}
			}  
		},
	],
	game_states : {
		turn: {type: Number, default: 0},
		active_player: {type: String},
		water_level: {type: Number, default: 0},
		food_level: {type: Number, default: 0},
		wood_level: {type: Number, default: 0},
		raft_level: {type: Number, default: 0},
		dead_level: {type: Number, default: 0},
	},
	action_cards: {
		cards: [
			{
				name: {type: String},
				position: {type: Number},
				illustration: {type: String},
				visibility: {type: String, default: 'hidden'}, //[ "visiblie", "hidden"]
				usage_number: {type: String}, //[ "0", "1", "infinity"]
				usage_left: {type: String}, //[ "0", 1", "infinity"]
				game_set: {type: String}, //[ "base_game", extention_1"]
				function: {type: String},
			}
		]
	},
	water_cards: {
		current_card: {
			name: {type: String},
			position: {type: Number},
			illustration: {type: String, default: 'water_back.jpg'},
			water_level: {type: Number}
		},
		cards: [
			{
				name: {type: String},
				position: {type: Number},
				illustration: {type: String},
				water_level: {type: Number}
			}
		]
	},
	activities: [
		{
			author_id: {type: String},
			content: {type: String},
			timestamp: {type: Date, default: () => moment()},
			status: {type: String, default: ''}
		}
	]
}, {collection: 'game'});

game.statics.get_all_players = function( game_token ){
	return new Promise((resolve, reject) => {
		game.findOne({game_token: game_token}, {}).exec()
			.then(game => {
				if( game ){
					resolve( game.players );
				}
				else{
					resolve( [] );
				}
			})
	})
};

game.statics.get_all_games = function(){
	return new Promise((resolve, reject) => {
		game.find({}, {}).exec()
			.then(games => {
				if( games ){
					resolve( games );
				}
				else{
					resolve([]);
				}
			})
	})
};

game.statics.get_a_player = function(game_token, player_id){
	return new Promise((resolve, reject) => {
		game.findOne({game_token: game_token}, {}).exec()
			.then(game => {
				if( game ){
					for (var i = game.players.length - 1; i >= 0; i--) {
						if( game.players[i]._id == player_id){
							resolve( game.players[i] );
						}
					}
				}else{
					reject( undefined );
				}
			})
	})
};

game.statics.get_next_player = function(game_token, position){
	return new Promise((resolve, reject) => {
		game.findOne({game_token: game_token}, {}).exec()
			.then(game => {
				if( game ){
					console.log('model ' + game_token + ' ' + position);
					for (var i = game.players.length - 1; i >= 0; i--) {
						if( game.players[i].game_detail.position == position){
							resolve( game.players[i] );
						}
					}
				}else{
					reject( undefined );
				}
			})
	})
};
game.statics.update_all_players = function( game_token, players ){
	return new Promise((resolve, reject) => {
		game.updateOne({ game_token: game_token }, {
			'players': players
		}).exec()
		.then( are_players_updated => {
		    resolve( are_players_updated );
		})
	})
};

game.statics.add_player = function( game_token, player ){
	return new Promise((resolve, reject) => {
		game.updateOne({ game_token: game_token }, {
			$push:{
				'players': player
			}
		}).exec()
		.then( is_player_added => {
		    resolve( is_player_added );
		})
	})
};

game.statics.remove_player = function( game_token, player_id ){
	return new Promise((resolve, reject) => {
		game.updateOne({ game_token: game_token }, {
			$pull: { 
				"players" : {
					'_id': player_id
				}
			},
		}).exec()
		.then( is_player_removed => {
			resolve( is_player_removed );
		})
	})
};

game.statics.update_activity_status = function(game_token, player_id, status){
	return new Promise((resolve, reject) => {
		game.updateOne({ game_token: game_token, 'players._id': player_id }, {
			$set: { 
				"players.$.status" : status,
			}
		}).exec()
		.then ( is_status_updated => {
			resolve( is_status_updated );
		})
	})
};

game.statics.update_last_online_time = function(game_token, player_id, date){
	return new Promise((resolve, reject) => {
		game.updateOne({ game_token: game_token, 'players._id': player_id }, {
			$set: { 
				"players.$.last_online_time" : date,
			}
		}).exec()
		.then ( is_last_online_time_updated => {
			resolve( is_last_online_time_updated );
		})
	})
};

game.statics.update_player_cards = function(game_token, player_id, cards){
	return new Promise((resolve, reject) => {
		game.updateOne({ game_token: game_token, 'players._id': player_id }, {
			$set: { 
				"players.$.game_detail.cards" : cards,
			}
		}).exec()
		.then ( are_cards_updated => {
			resolve( are_cards_updated );
		})
	})
};


game.statics.update_player_game_status = function(game_token, player_id, status){
	return new Promise((resolve, reject) => {
		game.updateOne({ game_token: game_token, 'players._id': player_id }, {
			$set: { 
				"players.$.game_detail.status" : status,
			}
		}).exec()
		.then ( is_game_status_updated => {
			resolve( is_game_status_updated );
		})
	})
};

game.statics.add_activity = function(game_token, payload){
	return new Promise((resolve, reject) => {
		game.updateOne({ game_token: game_token }, {
			$push:{
				'activities': payload
			}
		}).exec()
		.then (is_activity_added => {
			resolve( is_activity_added );
		})
	})
};

game.statics.remove_game = function(game_token){
	return new Promise((resolve, reject) => {
		game.deleteOne({ game_token: game_token }, {}).exec()
		.then (is_game_deleted => {
			resolve( is_game_deleted );
		})
	})
};

game.statics.get_last_activities = function(game_token, count){
	return new Promise((resolve, reject) => {
		game.findOne(
				{ game_token: game_token },
				{ activities:
					[
						{ $sort: { timestamp: -1 } },
						{ $slice: count }
					]
				}).exec()
			.then(game => {
				if( game ){
					resolve( game.activities );
				}else{
					reject( undefined );
				}
			})
	})
};

game.statics.update_water_cards = function(game_token, water_cards){
	return new Promise((resolve, reject) => {
		game.updateOne({ game_token: game_token }, {
			'water_cards.cards': water_cards
		}).exec()
		.then (are_water_cards_updated => {
			resolve( are_water_cards_updated );
		})
	})
};


game.statics.get_current_water_card = function(game_token){
	return new Promise((resolve, reject) => {
		game.findOne({game_token: game_token}, {}).exec()
			.then(game => {
				if( game ){
					resolve( game.water_cards.current_card );
				}else{
					reject( undefined );
				}
			})
	})
};


game.statics.update_current_water_card = function(game_token, water_card){
	return new Promise((resolve, reject) => {
		game.updateOne({ game_token: game_token }, {
			'water_cards.current_card': water_card
		}).exec()
		.then (is_current_water_card_updated => {
			resolve( is_current_water_card_updated );
		})
	})
};

game.statics.get_a_water_card = function(game_token, position){
	return new Promise((resolve, reject) => {
		game.findOne({game_token: game_token}, {}).exec()
			.then(game => {
				if( game ){
					for (var i = game.water_cards.cards.length - 1; i >= 0; i--) {
						if( game.water_cards.cards[i].position == position){
							resolve( game.water_cards.cards[i] );
						}
					}
				}else{
					reject( undefined );
				}
			})
	})
};

game.statics.get_next_action_card = function( game_token ){
	return new Promise((resolve, reject) => {
		game.findOne({game_token: game_token}, {}).exec()
			.then(game => {
				if( game ){
					resolve( game.action_cards.cards[game.action_cards.cards.length - 1] )
				}else{
					reject( undefined );
				}
			})
	})
};

game.statics.get_all_action_cards = function( game_token ){
	return new Promise((resolve, reject) => {
		game.findOne({game_token: game_token}, {}).exec()
			.then(game => {
				if( game ){
					console.log( game.action_cards.cards.length )
					resolve( game.action_cards.cards.length )
				}else{
					resolve( [] );
				}
			})
	})
};

game.statics.delete_last_action_card = function( game_token ){
	return new Promise((resolve, reject) => {
		game.updateOne({ game_token: game_token }, {
			$pop: {
				"action_cards.cards" : 1
			},
		}).exec()
		.then( is_player_removed => {
			resolve( is_player_removed );
		})
	})
};

game.statics.update_action_cards = function(game_token, action_cards){
	return new Promise((resolve, reject) => {
		game.updateOne({ game_token: game_token }, {
			'action_cards.cards': action_cards
		}).exec()
		.then (are_action_cards_updated => {
			resolve( are_action_cards_updated );
		})
	})
};

game.statics.get_game_states = function( game_token ){
	return new Promise((resolve, reject) => {
		game.findOne({game_token: game_token}, {}).exec()
			.then(game => {
				if( game ){
					resolve( game.game_states );
				}
				else{
					resolve( [] );
				}
			})
	})
};

game.statics.update_game_states = function(game_token, payload){
	return new Promise((resolve, reject) => {
		game.updateOne({ game_token: game_token }, {
			'game_states': payload,
		}).exec()
		.then (is_activity_added => {
			resolve( is_activity_added );
		})
	})
};

game.statics.delete_old_game = function( game_token ){
	return new Promise((resolve, reject) => {
		game.deleteOne( { game_token: game_token }).exec()
		.then( is_game_removed => {
			resolve( is_game_removed );
		})
	})

};

var game = mongoose.DB.model('game', game);
module.exports.game = game