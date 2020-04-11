var Promise = require('bluebird');

// HELPERS
const littlebirds = require('../helpers/littlebirds');

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

module.exports={
	'check_if_name_unique': check_if_name_unique,
}