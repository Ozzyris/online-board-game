const game_model = require('../models/game').game;

//VARS
var	global_io,
	global_socket;

function activity(io, socket) {
	global_io = io;
	global_socket = socket;

	socket.on('connect-player', function ( payload ) {
		global_socket.game_token = payload.game_token;
		global_socket.player_id = payload.player_id;
		connect_player();
	});
	socket.on('disconnect', function () {
		disconnect()
	});
}

function connect_player(){
	console.log('connect');
	let activity = {};

	game_model.update_activity_status( global_socket.game_token, global_socket.player_id, 'online'  )
		.then(is_activity_status_updated => {
			// console.log( is_activity_status_updated );
			return game_model.get_a_player( global_socket.game_token, global_socket.player_id );
		})
		.then(player => {
			// console.log( player );
			activity.author_id = global_socket.player_id;
			activity.content = '<span>' + player.name + '</span> joined the lobby.';
			return game_model.add_activity( global_socket.game_token, activity );
		})
		.then(is_activity_added => {
			// console.log( is_activity_added );
			global_io.emit( 'update-player-status', {player_id: global_socket.player_id, status: 'online'} );
			global_io.emit( 'new-activity', activity );
		})
}
function disconnect(){
	console.log('disconnect');
	let activity = {};

	game_model.update_activity_status( global_socket.game_token, global_socket.player_id, 'offline'  )
		.then(is_activity_status_updated => {
			// console.log( is_activity_status_updated );
			return game_model.get_a_player( global_socket.game_token, global_socket.player_id );
		})
		.then(player => {
			// console.log( player );
			activity.author_id = global_socket.player_id;
			activity.content = '<span>' + player.name + '</span> left the lobby.';
			return game_model.add_activity( global_socket.game_token, activity );
		})
		.then(is_activity_added => {
			// console.log( is_activity_added );
			global_io.emit( 'update-player-status', {player_id: global_socket.player_id, status: 'offline'} );
			global_io.emit( 'new-activity', activity );
		})
}

function broadcast(route, payload){
	global_io.emit( route, payload );
}

module.exports={
	'activity': activity,
	'broadcast': broadcast,
};