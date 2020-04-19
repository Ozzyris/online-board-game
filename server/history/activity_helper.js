const game_model = require('../models/game').game;

// HELPERS
const littlebirds = require('../helpers/littlebirds'),
	  cron_helper = require('../helpers/cron_helper');

var Promise = require('bluebird');

function check_if_name_unique( players, player_name ){
	return new Promise((resolve, reject)=>{
		let is_name_unique = true;

		for (var i = players.length - 1; i >= 0; i--) {
			if( players[i].name.toLowerCase() == player_name.toLowerCase() ){
				is_name_unique = false;
			}
		}
		resolve( is_name_unique );
	})
}
function go_offline(){
	console.log('go_offline');
	let activity = {};

	cron_helper.stop_cron( socket.player_id )
		.then(is_cron_stoped => {
			return game_model.update_activity_status( socket.game_token, socket.player_id, 'offline'  );
		})
		.then(is_activity_status_updated => {
			return game_model.get_a_player( socket.game_token, socket.player_id );
		})
		.then(player => {
			activity.author_id = socket.player_id;
			activity.content = '<span>' + player.name + '</span> left the lobby.';
			return game_model.add_activity( socket.game_token, activity );
		})
		.then(is_activity_added => {
			activity.status = 'new';
			littlebirds.broadcast('update-player-status', socket.game_token, {player_id: socket.player_id, status: 'offline'})
			littlebirds.broadcast('new-activity', socket.game_token, activity)
		})
		.catch( error => {
			// disconnect someone who does not exsit on the database anymore
			console.log( error );
		})

}

module.exports={
	'check_if_name_unique': check_if_name_unique,
	'go_offline': go_offline,
}