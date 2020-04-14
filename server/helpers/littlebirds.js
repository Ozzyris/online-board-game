const game_model = require('../models/game').game
	  moment = require('moment');

var global_io; 

// HELPERS
const activity_helper = require('../helpers/activity_helper');

function init_socket_io( io ){
	global_io = io;

	io.on('connection', function( socket ) {
		handshake( socket );

		socket.on('connect-player', (payload) => {
			socket.player_id = payload.player_id;
			socket.game_token = payload.game_token;

			connect_player( socket );
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

	// Update last_online_time of the player
	socket.emit('handshake', handshake_payload);
}

function connect_player( socket ){
	let activity = {};

	game_model.update_activity_status( socket.game_token, socket.player_id, 'online'  )
		.then(is_activity_status_updated => {
			return game_model.get_a_player( socket.game_token, socket.player_id );
		})
		.then(player => {
			// join socket io room
			socket.join( socket.player_id );
			socket.join( socket.game_token );

			activity.author_id = socket.player_id;
			activity.content = '<span>' + player.name + '</span> joined the lobby.';
			return game_model.add_activity( socket.game_token, activity );
		})
		.then(is_activity_added => {
			activity.status = 'new';
			broadcast('update-player-status', socket.game_token, {player_id: socket.player_id, status: 'online'})
			broadcast('new-activity', socket.game_token, activity)
		})
		.catch( error => {
			console.log( error );
		})
}
function disconnect( socket ){
	let activity = {};

	game_model.update_activity_status( socket.game_token, socket.player_id, 'offline'  )
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
			broadcast('update-player-status', socket.game_token, {player_id: socket.player_id, status: 'offline'})
			broadcast('new-activity', socket.game_token, activity)
		})
		.catch( error => {
			// disconnect someone who does not exsit on the database anymore
			// console.log( error );
		})
}

function send_message( socket, message ){
	let activity = {};

	game_model.get_a_player( socket.game_token, socket.player_id )
		.then(player => {
			activity.author_id = socket.player_id;
			activity.content = '<span>' + player.name + '</span>says: ' + message.content;
			return game_model.add_activity( socket.game_token, activity );
		})
		.then(is_activity_added => {
			activity.status = 'new';
			broadcast('new-activity', socket.game_token, activity)
		})
}

function broadcast(route, game_token, payload){
	global_io.in( game_token ).emit( route, payload );
}

module.exports={
	init_socket_io: init_socket_io,
	broadcast: broadcast
};