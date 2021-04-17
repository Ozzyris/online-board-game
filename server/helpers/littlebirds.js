// PACKAGES
var Promise = require('bluebird'),
	CronJobManager = require('cron-job-manager'),
	moment = require('moment');

// MODELS
const game_model = require('../models/game').game;

// GOLBALES
var global_io,
	currentSockets = {},
	cron_manager = new CronJobManager();;


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

function connect_player( socket ){
	let activity = {},
		is_new_connection, 
		updated_online_time = moment();

	game_model.update_activity_status( currentSockets[socket.id].game_token, currentSockets[socket.id].player_id, 'online'  )
		.then(is_activity_status_updated => {
			broadcast('update-player-status', currentSockets[socket.id].game_token, {player_id: currentSockets[socket.id].player_id, status: 'online'});
			return stop_cron( currentSockets[socket.id].player_id );
		})
		.then(is_cron_stopped => {
			return game_model.get_a_player( currentSockets[socket.id].game_token, currentSockets[socket.id].player_id );
		})
		.then(player => {
			if( moment( player.last_online_time ).add(5, 'm').isAfter( moment() ) ){
				is_new_connection = false
				return;
			}else{
				activity.author_id = player._id;
				activity.content = '<span>' + player.name + '</span> joined the lobby.';
				is_new_connection = true;

				return game_model.add_activity( currentSockets[socket.id].game_token, activity );
			}
		})
		.then(is_activity_added => {
			if( is_new_connection ){
				activity.status = 'new';
				broadcast('new-activity', currentSockets[socket.id].game_token, activity);
			}

			return game_model.update_last_online_time( currentSockets[socket.id].game_token, currentSockets[socket.id].player_id, updated_online_time );

		})
		.then(is_last_online_time_updated => {		
			broadcast('update-player-last-online-time', currentSockets[socket.id].game_token, {player_id: currentSockets[socket.id].player_id, last_online_time: updated_online_time});
		})
		.catch( error => {
			console.log( error );
		})
}

function reconnect_player( socket ){
	// console.log('reconnect_player', socket.id, currentSockets[socket.id].player_id, currentSockets[socket.id].game_token );

	let updated_online_time = moment();

	game_model.update_last_online_time( currentSockets[socket.id].game_token, currentSockets[socket.id].player_id, updated_online_time )
		.then(is_last_online_time_updated => {
			broadcast('update-player-last-online-time', currentSockets[socket.id].game_token, {player_id: currentSockets[socket.id].player_id, last_online_time: updated_online_time});
			return game_model.update_activity_status( currentSockets[socket.id].game_token, currentSockets[socket.id].player_id, 'online'  );
		})
		.then(is_player_reconnected => {
			broadcast('update-player-status', currentSockets[socket.id].game_token, {player_id: currentSockets[socket.id].player_id, status: 'online'});
		})
		.catch( error => {
			console.log( error );
		})
}

function disconnect( socket ){
	game_model.update_activity_status( currentSockets[socket.id].game_token, currentSockets[socket.id].player_id, 'inactive'  )
		.then(is_activity_status_updated => {
			broadcast('update-player-status', currentSockets[socket.id].game_token, {player_id: currentSockets[socket.id].player_id, status: 'inactive'})
			return convert_date_to_cron( moment().add(5, 'm') );
		})
		.then(cron_date => {
			return launch_cron( currentSockets[socket.id].player_id, cron_date, socket );
		})
		.then(is_cron_started => {
		})
		.catch( error => {
			console.log( error );
		})
}

function go_offline( socket ){
	// console.log('go_offline', socket.id, currentSockets[socket.id].player_id, currentSockets[socket.id].game_token );

	let activity = {};

	game_model.update_activity_status( currentSockets[socket.id].game_token, currentSockets[socket.id].player_id, 'offline'  )
		.then(is_activity_status_updated => {
			broadcast('update-player-status', currentSockets[socket.id].game_token, {player_id: currentSockets[socket.id].player_id, status: 'offline'});
			return stop_cron( currentSockets[socket.id].player_id );
		})
		.then(is_cron_stopped => {
			return game_model.get_a_player( currentSockets[socket.id].game_token, currentSockets[socket.id].player_id );
		})
		.then(player => {
			activity.author_id = player._id;
			activity.content = '<span>' + player.name + '</span> left the lobby.';
			return game_model.add_activity( currentSockets[socket.id].game_token, activity );
		})
		.then(is_activity_added => {
			activity.status = 'new';
			broadcast('new-activity', currentSockets[socket.id].game_token, activity);
			delete currentSockets[socket.id];
		})
		.catch( error => {
			console.log( error );
		})
}

function send_message( socket, message ){
	// console.log('send_message', socket.id, currentSockets[socket.id].player_id, currentSockets[socket.id].game_token );

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
			return test_for_admin_command( currentSockets[socket.id].game_token, currentSockets[socket.id].player_id, message.content, player.rank );
		})
		.then(is_admin_command => {
			if(is_admin_command){
				throw { message: 'admin command'}
			}else{
				return game_model.add_activity( currentSockets[socket.id].game_token, activity );

			}
		})
		.then(is_activity_added => {
			activity.status = 'new';
			broadcast('new-activity', currentSockets[socket.id].game_token, activity);
		})
		.catch( error => {
			console.log( error );
		})
}

function broadcast(route, room_id, payload){
	global_io.in( room_id ).emit( route, payload );
}

//CRON
function convert_date_to_cron( date ){
	return new Promise((resolve, reject)=>{
		let cron_date = moment(date).minute() + ' ' + moment(date).hour() + ' ' + moment(date).date() + ' ' + moment(date).month() + ' *';
		resolve( cron_date );
	})
}

function launch_cron( player_id, cron_date, socket ){
	return new Promise((resolve, reject)=>{
		if( player_id == undefined ){
			reject({message: 'player_id is undefined'});
		}else{
			cron_manager.add(player_id, cron_date, () => { go_offline( socket ) }, { timeZone:"Europe/Paris", start:true });
			resolve( true );
		}
	})
}

function stop_cron( player_id ){
	return new Promise((resolve, reject)=>{		
		if( cron_manager.exists( player_id ) ){
			resolve( cron_manager.deleteJob( player_id ) );
		}else{
			resolve( true );
		}
	})
}

function is_there_a_cron_active( player_id ){
	return new Promise((resolve, reject)=>{
		resolve( cron_manager.exists(player_id) );
	})
}

function all_active_cron(){
	return new Promise((resolve, reject)=>{
		resolve( `all active cron ${cron_manager}`);
	})
}

function test_for_admin_command( game_token, player_id, content, rank ){
	return new Promise((resolve, reject)=>{
		if( content.slice(0, 8) == "/admin: "){
			if( rank == "administrator" ){
				resolve(true);
				switch( content.slice(8, 11) ){
					case 'add':
						if( Number.isInteger( parseInt(content.slice(13, 14)) ) ){
							broadcast('new-toast', player_id, {content: 'Only number from 0 to 9 are accepted'});
						}else if( !Number.isInteger( parseInt(content.slice(12, 13)) ) ){
							broadcast('new-toast', player_id, {content: 'There is a probleme with your number'});
						}else{
							manage_game_states(game_token, content.slice(14, content.length), 'add', parseInt(content.slice(12, 13)));
						}
						break;
					case 'rem':
						if( Number.isInteger( parseInt(content.slice(16, 17)) ) ){
							broadcast('new-toast', player_id, {content: 'Only number from 0 to 9 are accepted'});
						}else if( !Number.isInteger( parseInt(content.slice(15, 16)) ) ){
							broadcast('new-toast', player_id, {content: 'There is a probleme with your number'});
						}else{
							manage_game_states(game_token, content.slice(17, content.length), 'remove', parseInt(content.slice(15, 16)));
						}
						break;
					case 'sta':
						start_turn( game_token );
						break;
					case 'ski':
						skip_turn( game_token );
						break;
					default:
						broadcast('new-toast', player_id, {content: 'The admin action wasn\'t recognize.'});
						break;
				}
			}else{
				broadcast('new-toast', player_id, {content: 'You need to be administrator for this command.'});
				resolve(false);
			}
		}else{
			resolve(false);
		}
		
	})
}

function manage_game_states(game_token, type, action, nb){
	let activity = {};

	game_model.get_game_states( game_token )
		.then(game_states => {
			type_id = type + '_level';

			if(action == 'add'){
				activity.content = nb + ' unit of <span>' + type + '</span>was added';
				game_states[type_id] = game_states[type_id] + nb;
			}
			if(action == 'remove'){
				activity.content = nb + ' unit of <span>' + type + '</span>was removed';
				game_states[type_id] = game_states[type_id] - nb;
			}

			broadcast('update-game-states', game_token, game_states);
			return game_model.update_game_states( game_token, game_states );
		})
		.then(are_game_states_updated => {
			return game_model.add_activity( game_token, activity );
		})
		.then(is_activity_added => {
			activity.status = 'new';
			broadcast('new-activity', game_token, activity);
		})
		.catch( error => {
			console.log(error);
		})	
}

function start_turn( game_token ){
	let activity = {},
		player_details,
		water_card_details;

	game_model.get_a_water_card( game_token, 0 )
		.then(water_card => {
			water_card_details = water_card;
			return game_model.update_current_water_card( game_token, water_card_details );
		})
		.then( is_current_water_card_updated => {
			broadcast('new-water-card', game_token, water_card_details);
			return game_model.get_next_player( game_token, 0 );
		})
		.then(player => {
			player_details = player;
			return game_model.get_game_states( game_token );
		})
		.then(game_states => {
			game_states.active_player = player_details._id;
			return game_model.update_game_states( game_token, game_states );
		})
		.then(are_game_states_updated => {
			activity.content = 'It\'s <span>' + player_details.name + '</span>turn to play.';
			broadcast('new-toast', player_details._id, {content: "It's your turn to play!"});
			broadcast('update_active_player', game_token, {player_id: player_details._id});
			return game_model.add_activity( game_token, activity );
		})
		.then(is_activity_added => {
			activity.status = 'new';
		})
		.catch( error => {
			console.log(error);
		})
}

function skip_turn( game_token ){
	let is_next_round,
		activity = {},
		game_states;

	game_model.get_game_states( game_token )
		.then( current_game_states => {
			game_states = current_game_states;

			return game_model.get_all_players( game_token );
		})
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

			// create activity content
			activity.content = 'It\'s <span>' + next_player.name + '</span>turn to play.';

			return game_model.update_game_states( game_token, game_states );
		})
		.then(are_game_states_updated => { // Update game states
			broadcast('new-toast', game_states.active_player, {content: "It's your turn to play!"});
			broadcast('update_active_player', game_token, {player_id: game_states.active_player});

			return game_model.add_activity( game_token, activity );
		})
		.then(is_activity_added => {
			activity.status = 'new';
			setTimeout(function(){
				broadcast('new-activity', game_token, activity);
			}, 1000);
		})
		.catch( error => {
			console.log(error);
		})
}

module.exports={
	'init_socket_io': init_socket_io,
	'broadcast': broadcast,
	'all_active_cron': all_active_cron
}