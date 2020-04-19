const game_model = require('../models/game').game;

//VARS
let	global_io,
	global_socket;

function activity(io, socket) {
	global_io = io;
	global_socket = socket;

	global_socket.on('connect-player', ( payload ) => {
		global_socket.game_token = payload.game_token;
		global_socket.player_id = payload.player_id;

		connect_player();
	});

	global_socket.on('disconnect', () => {
		disconnect()
	});
}

function connect_player(){
	let activity = {};

	game_model.update_activity_status( global_socket.game_token, global_socket.player_id, 'online'  )
		.then(is_activity_status_updated => {
			// console.log( is_activity_status_updated );
			return game_model.get_a_player( global_socket.game_token, global_socket.player_id );
		})
		.then(player => {
			// console.log( player );

			console.log('connect ' + player.name);
			global_socket.join( global_socket.player_id );
			global_socket.join( global_socket.game_token );

			activity.author_id = global_socket.player_id;
			activity.content = '<span>' + player.name + '</span> joined the lobby.';
			return game_model.add_activity( global_socket.game_token, activity );
		})
		.then(is_activity_added => {
			// console.log( is_activity_added );
			broadcast('update-player-status', global_socket.game_token, {player_id: global_socket.player_id, status: 'online'})
			broadcast('new-activity', global_socket.game_token, activity)
		})
		.catch( error => {
			console.log( error );
		})
}
function disconnect(){
	let activity = {};

	game_model.update_activity_status( global_socket.game_token, global_socket.player_id, 'offline'  )
		.then(is_activity_status_updated => {
			// console.log( is_activity_status_updated );
			return game_model.get_a_player( global_socket.game_token, global_socket.player_id );
		})
		.then(player => {
			// console.log( player );
			console.log('disconnect ' + player.name);
			activity.author_id = global_socket.player_id;
			activity.content = '<span>' + player.name + '</span> left the lobby.';
			return game_model.add_activity( global_socket.game_token, activity );
		})
		.then(is_activity_added => {
			// console.log( is_activity_added );
			broadcast('update-player-status', global_socket.game_token, {player_id: global_socket.player_id, status: 'offline'})
			broadcast('new-activity', global_socket.game_token, activity)
		})
		.catch( error => {
			// disconnect someone who does not exsit on the database anymore
			// console.log( error );
		})
}

function broadcast(route, game_token, payload){
	global_io.in( game_token ).emit( route, payload );
}

module.exports={
	'activity': activity,
	'broadcast': broadcast
};