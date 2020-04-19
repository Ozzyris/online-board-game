const game_model = require('../models/game').game,
	  moment = require('moment');

var global_io,
	global_player_id,
	global_game_token; 

// HELPERS
const activity_helper = require('../helpers/activity_helper'),
	  cron_helper = require('../helpers/cron_helper');

function init_socket_io( io ){
	global_io = io;

	io.on('connection', function( socket ) {
		handshake( socket );

		socket.on('connect-player', (payload) => {
			global_player_id = payload.player_id;
			global_game_token = payload.game_token;

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
	console.log( 'launch connect session for ' + global_player_id );

	let activity = {},
		is_new_connection, 
		updated_online_time = moment();


	cron_helper.is_there_a_cron_active( global_player_id )
		.then(is_cron_active => {
			if(is_cron_active){
				return cron_helper.stop_cron( global_player_id );
			}else{
				return;
			}
		})
		.then(is_cron_stopped => {
			return game_model.update_activity_status( global_game_token, global_player_id, 'online'  );
		})
		.then(is_activity_status_updated => {
			return game_model.get_a_player( global_game_token, global_player_id );
		})
		.then(player => {
			// join socket io room
			socket.join( global_player_id );
			socket.join( global_game_token );

			if( moment( player.last_online_time ).add(5, 'm').isAfter( moment() ) ){
				is_new_connection = false
				return;
			}else{
				activity.author_id = global_player_id;
				activity.content = '<span>' + player.name + '</span> joined the lobby.';
				is_new_connection = true;
				return game_model.add_activity( global_game_token, activity );

			}
		})
		.then(is_activity_added => {
			if( is_new_connection ){
				activity.status = 'new';
				broadcast('new-activity', global_game_token, activity);
			}

			broadcast('update-player-status', global_game_token, {player_id: global_player_id, status: 'online'});
			return game_model.update_last_online_time( global_game_token, global_player_id, updated_online_time );

		})
		.then(is_last_online_time_updated => {		
			broadcast('update-player-last-online-time', global_game_token, {player_id: global_player_id, last_online_time: updated_online_time});
		})
		.catch( error => {
			console.log( error );
		})
}

function disconnect( socket ){
	console.log( 'launch disconnect session for ' + global_player_id );

	cron_helper.is_there_a_cron_active( global_player_id )
		.then(is_cron_active => {
			if( is_cron_active ){
				throw({message: 'cron already active'});
			}else{
				 return game_model.update_activity_status( global_game_token, global_player_id, 'inactive'  );
			}
		})
		.then(is_activity_status_updated => {
			return cron_helper.convert_date_to_cron( moment().add(2, 'm') );
			broadcast('update-player-status', global_game_token, {player_id: global_player_id, status: 'inactive'})
		})
		.then(cron_date => {
			return cron_helper.launch_cron( global_player_id, cron_date );
		})
		.catch( error => {
			// disconnect someone who does not exist on the database anymore
			console.log( error );
		})
}

function send_message( socket, message ){
	let activity = {}, 
		updated_online_time = moment();

	console.log('send_message: ' + global_game_token + ' | ' + global_player_id);

	game_model.get_a_player( global_game_token, global_player_id )
		.then(player => {
			activity.author_id = global_player_id;
			activity.content = '<span>' + player.name + '</span>says: ' + message.content;
			return game_model.add_activity( global_game_token, activity );
		})
		.then(is_activity_added => {
			return game_model.update_last_online_time( global_game_token, global_player_id, updated_online_time );
		})
		.then(is_last_online_time_updated => {
			activity.status = 'new';
			broadcast('new-activity', global_game_token, activity);
			broadcast('update-player-last-online-time', global_game_token, {player_id: global_player_id, last_online_time: updated_online_time});
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