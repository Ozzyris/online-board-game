// PACKAGES

// MODELS

function shuffle_water_cards( water_cards ){
	return new Promise((resolve, reject)=>{
		let shuffled_water_card = shuffle_array( water_cards.base_carte );
			random_number = random_nb_from_interval( (shuffled_water_card.length - 6), shuffled_water_card.length );
		shuffled_water_card.splice( random_number, 0, water_cards.storm_card );

		for(var i = 0; i <= (shuffled_water_card.length-1); i++){
			shuffled_water_card[i].position = i;
		}
		resolve( shuffled_water_card );
	})
}

function shuffle_action_cards( action_card, player_length ){
	return new Promise((resolve, reject)=>{
		console.log(player_length);
		let shuffled_action_card = shuffle_array( action_card ),
			nb_of_card_by_player = 4,
			distributed_card = {
				"draft": [], 
			};

		if( player_length > 8 ){ nb_of_card_by_player = 3 }

		//Divide this stack by the number of players
		let current_player = 0;
		for(var i = 0; i <= (shuffled_action_card.length-1); i++){
			if(i < (nb_of_card_by_player * player_length)){
				if(current_player == player_length){ current_player = 0 }
				let player_id = 'player_' + current_player;
				if( distributed_card[player_id] == undefined){ distributed_card[player_id] = [] }
				distributed_card[player_id].push(shuffled_action_card[i]);
				current_player ++;
			}else{
				shuffled_action_card[i].position = i - (nb_of_card_by_player * player_length);
				distributed_card.draft.push( shuffled_action_card[i] )
			}
		}

		resolve( distributed_card );
	})
}

function shuffle_player_order( players ){
	return new Promise((resolve, reject)=>{
		let shuffled_players = shuffle_array( players );
		for (var i = shuffled_players.length - 1; i >= 0; i--) {
			shuffled_players[i].game_detail.position = i
		}
		resolve( shuffled_players );
	})
}

function manage_game_states_level( player_number ){
	return new Promise((resolve, reject)=>{
		let ration_level = {
			food_level: 0,
			water_level: 0
		};
		switch( player_number ){
			case 3:
				ration_level.food_level = 5; ration_level.water_level = 6;
				break;
			case 4:
				ration_level.food_level = 7; ration_level.water_level = 8;
				break;
			case 5:
				ration_level.food_level = 8; ration_level.water_level = 10;
				break;
			case 6:
				ration_level.food_level = 10; ration_level.water_level = 12;
				break;
			case 7:
				ration_level.food_level = 12; ration_level.water_level = 14;
				break;
			case 8:
				ration_level.food_level = 13; ration_level.water_level = 16;
				break;
			case 9:
				ration_level.food_level = 15; ration_level.water_level = 18;
				break;
			case 10:
				ration_level.food_level = 16; ration_level.water_level = 20;
				break;
			case 11:
				ration_level.food_level = 18; ration_level.water_level = 22;
				break;
			case 12:
				ration_level.food_level = 20; ration_level.water_level = 24;
				break;
		}
		resolve( ration_level );
	})
}

function shuffle_array( array ){
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function random_nb_from_interval(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

module.exports={
	'shuffle_water_cards': shuffle_water_cards,
	'shuffle_action_cards': shuffle_action_cards,
	'shuffle_player_order': shuffle_player_order,
	'manage_game_states_level': manage_game_states_level,
}