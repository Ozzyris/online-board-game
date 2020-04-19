const game_model = require('../models/game').game,
	  moment = require('moment');

var global_io,
	currentSockets = {};

// HELPERS
const cron_helper = require('../helpers/cron_helper');

function init_socket_io( io ){
	global_io = io;

	io.on('connection', function( socket ) {
		currentSockets[socket.id] = {socket: socket};

		handshake( socket );

		socket.on('connect-player', (payload) => {
			currentSockets[socket.id].player_id = payload.player_id; 
			currentSockets[socket.id].game_token = payload.game_token;
			// join socket io room
			socket.join( currentSockets[socket.id].player_id );
			socket.join( currentSockets[socket.id].game_token );

			connect_player( socket );
		})
		socket.on('reconnect-player', (payload) => {
			currentSockets[socket.id].player_id = payload.player_id; 
			currentSockets[socket.id].game_token = payload.game_token;
			// join socket io room
			socket.join( currentSockets[socket.id].player_id );
			socket.join( currentSockets[socket.id].game_token );

			reconnect_player( socket );
		})
		socket.on('disconnect', function () {
			disconnect( socket );
		})
		socket.on('send-message', function (message) {
			send_message( socket, message );
		})
	});
}

function handshake( socket ){
	let handshake_payload = {
		timestamp: moment(),
		content: 'Connecté au serveur'
	};

	socket.emit('handshake', handshake_payload);
}
function reconnect_player( socket ){
	console.log('reconnect_player', socket.id, currentSockets[socket.id].player_id, currentSockets[socket.id].game_token );
	let updated_online_time = moment();

	game_model.update_last_online_time( currentSockets[socket.id].game_token, currentSockets[socket.id].player_id, updated_online_time )
		.then(is_last_online_time_updated => {
			broadcast('update-player-last-online-time', currentSockets[socket.id].game_token, {player_id: currentSockets[socket.id].player_id, last_online_time: updated_online_time});
		})
		.catch( error => {
			console.log( error );
		})
}

function connect_player( socket ){

}

function disconnect( socket ){
	delete currentSockets[socket.id];
}

function send_message( socket, message ){
	console.log('send_message', socket.id, currentSockets[socket.id].player_id, currentSockets[socket.id].game_token );

	let activity = {}, 
		updated_online_time = moment();


	game_model.update_last_online_time( currentSockets[socket.id].game_token, currentSockets[socket.id].player_id, updated_online_time )
		.then(is_last_online_time_updated => {
			broadcast('update-player-last-online-time', currentSockets[socket.id].game_token, {player_id: currentSockets[socket.id].player_id, last_online_time: updated_online_time});
			return game_model.get_a_player( currentSockets[socket.id].game_token, currentSockets[socket.id].player_id );
		})
		.then(player => {
			activity.author_id = player._id;
			activity.content = '<span>' + player.name + '</span>says: ' + message.content;
			return game_model.add_activity( currentSockets[socket.id].game_token, activity );
		})
		.then(is_activity_added => {
			activity.status = 'new';
			broadcast('new-activity', currentSockets[socket.id].game_token, activity);
		})
		.catch( error => {
			console.log( error );
		})
}

function broadcast(route, game_token, payload){
	global_io.in( game_token ).emit( route, payload );
}

module.exports={
	'init_socket_io': init_socket_io,
	'broadcast': broadcast,
}