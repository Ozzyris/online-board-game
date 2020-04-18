// PACKAGES
var Promise = require('bluebird'),
	CronJobManager = require('cron-job-manager'),
	moment = require('moment');


// HELPERS
const activity_helper = require('../helpers/activity_helper');

// VARS
var cron_manager = new CronJobManager();

function convert_date_to_cron( date ){
	return new Promise((resolve, reject)=>{
		let cron_date = moment(date).minute() + ' ' + moment(date).hour() + ' ' + moment(date).date() + ' ' + moment(date).month() + ' *';
		resolve( cron_date );
	})
}

function launch_cron( player_id, cron_date, game_token ){
	return new Promise((resolve, reject)=>{
		if( player_id == undefined ){
			reject({message: 'player_id is undefined'});
		}else{
			cron_manager.add(player_id, cron_date, () => { go_offline(); }, { timeZone:"Europe/Paris", start:true, onComplete: () => {console.log("cron stopped")}});
			resolve( true );
			//activity_helper.go_offline();
		}
	})
}

function go_offline(){
	console.log('alex');
}

function stop_cron( player_id ){
	return new Promise((resolve, reject)=>{
		cron_manager.stop( player_id );
		resolve( true );
	})
}

function is_there_a_cron_active( player_id ){
	return new Promise((resolve, reject)=>{
		resolve( cron_manager.exists(player_id) );
	})
}

module.exports={
    'convert_date_to_cron': convert_date_to_cron,
    'launch_cron': launch_cron,
    'stop_cron': stop_cron,
    'is_there_a_cron_active': is_there_a_cron_active
};
