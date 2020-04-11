const game_model = require('../models/game').game
	  moment = require('moment');

// HELPERS
const activity_helper = require('../helpers/activity_helper');

function init_socket_io( io ){
	io.on('connection', function( socket ) {
		handshake( socket );

		//Socket routing
		require('../helpers/io_activity_helper').activity(io, socket);

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

module.exports={
    init_socket_io: init_socket_io
};