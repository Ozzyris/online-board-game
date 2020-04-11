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
			last_online_time: {type: Date, default: () => moment()},
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
						usage_number: {type: String, default: '1'}, //[ "0", "1", "infinity"]
						usage_left: {type: String, default: '1'}, //[ "0", 1", "infinity"]
						game_set: {type: String, default: 'base_game'}, //[ "base_game", extention_1"]
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
		water_level: {type: Number},
		food_level: {type: Number},
		wood_level: {type: Number},
		raft_level: {type: Number},
		dead_level: {type: Number},
	},
	action_cards: {
		cards: [
			{
				name: {type: String},
				position: {type: Number},
				illustration: {type: String},
				visibility: {type: String, default: 'hidden'}, //[ "visiblie", "hidden"]
				usage_number: {type: String, default: '1'}, //[ "0", "1", "infinity"]
				usage_left: {type: String, default: '1'}, //[ "0", 1", "infinity"]
				game_set: {type: String, default: 'base_game'}, //[ "base_game", extention_1"]
				function: {type: String},
			}
		]
	},
	water_cards: {
        current_card: {
			name: {type: String},
			position: {type: Number},
			illustration: {type: String},
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
			author: {type: String},
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
				resolve( game.players );             
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
                    resolve( undefined );
                }                
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


var game = mongoose.DB.model('game', game);
module.exports.game = game