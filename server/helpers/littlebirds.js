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
	console.log('reconnect_player', socket.id, currentSockets[socket.id].player_id, currentSockets[socket.id].game_token );

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
	console.log('go_offline', socket.id, currentSockets[socket.id].player_id, currentSockets[socket.id].game_token );

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
	// console.log(route, game_token, payload);
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
		console.log( game_token, content, rank );
		if( content.slice(0, 8) == "/admin: " && rank == "administrator"){
			resolve(true);
			switch( content.slice(8, content.length) ){
				case 'add water':
					manage_game_states(game_token, 'water', 'add', 1);
					break;
				case 'remove water':
					manage_game_states(game_token, 'water', 'remove', 1);
					break;
				case 'add food':
					manage_game_states(game_token, 'food', 'add', 1);
					break;
				case 'remove food':
					manage_game_states(game_token, 'food', 'remove', 1);
					break;
				case 'add wood':
					manage_game_states(game_token, 'wood', 'add', 1);
					break;
				case 'remove wood':
					manage_game_states(game_token, 'wood', 'remove', 1);
					break;
				case 'add raft':
					manage_game_states(game_token, 'raft', 'add', 1);
					break;
				case 'remove raft':
					manage_game_states(game_token, 'raft', 'remove', 1);
					break;
				default:
					broadcast('new-toast', player_id, {content: 'The admin action wasn\'t recognize.'});
					break;
			}
		}else{
			if(rank != "administrator"){
				broadcast('new-toast', player_id, {content: 'You need to be administrator for this command.'});
			}
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

// function object_size( object ){
// 	let size = 0,
// 		key;

// 	for (key in object) {
// 		if (object.hasOwnProperty(key)){
// 			size++;
// 		} 
// 	}
// 	return size;
// }

module.exports={
	'init_socket_io': init_socket_io,
	'broadcast': broadcast,
	'all_active_cron': all_active_cron
}