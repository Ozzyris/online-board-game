const game_model = require('../models/game').game,
	  moment = require('moment');

var global_io; 

// HELPERS
const activity_helper = require('../helpers/activity_helper'),
	  cron_helper = require('../helpers/cron_helper');

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
	console.log( 'Player_id from handshake ' + socket.player_id );
	let handshake_payload = {
			timestamp: moment(),
			content: 'Connecté au serveur'
		};

	// Update last_online_time of the player
	socket.emit('handshake', handshake_payload);
}

function connect_player( socket ){
	let activity = {};

	cron_helper.is_there_a_cron_active( socket.player_id )
		.then(is_cron_active => {
			console.log('is_cron_active: ' + is_cron_active);

			if(is_cron_active){
				return cron_helper.stop_cron( socket.player_id );
			}else{
				return;
			}
		})
		.then(is_activity_status_updated => {
			return game_model.update_activity_status( socket.game_token, socket.player_id, 'online'  );
		})
		.then(is_activity_status_updated => {
			return game_model.get_a_player( socket.game_token, socket.player_id );
		})
		.then(player => {
			// join socket io room
			socket.join( socket.player_id );
			socket.join( socket.game_token );

			activity.author_id = socket.player_id;
			activity.content = '<span>' + player.name + '</span> joined the lobby.';

			// console.log( player.last_online_time );
			//if player.last_online_time est moins grande que 5 min pas envoyer d'activité & pas en enreigstrer
			

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
	cron_helper.is_there_a_cron_active( socket.player_id )
		.then(is_cron_active => {
			if( is_cron_active ){
				throw({message: 'cron already active'});
			}else{
				 return game_model.update_activity_status( socket.game_token, socket.player_id, 'inactive'  );
			}
		})
		.then(is_activity_status_updated => {
			return cron_helper.convert_date_to_cron( moment().add(2, 'm') );
			broadcast('update-player-status', socket.game_token, {player_id: socket.player_id, status: 'inactive'})
		})
		.then(cron_date => {
			return cron_helper.launch_cron( socket.player_id, cron_date );
		})
		.catch( error => {
			// disconnect someone who does not exist on the database anymore
			console.log( error );
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
	'init_socket_io': init_socket_io,
	'broadcast': broadcast,
}