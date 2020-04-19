// PACKAGES
var Promise = require('bluebird'),
	CronJobManager = require('cron-job-manager'),
	moment = require('moment');


// HELPERS
const littlebirds = require('../helpers/littlebirds');

// VARS
var cron_manager = new CronJobManager();

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
			cron_manager.add(player_id, cron_date, () => { littlebirds.go_offline( socket ) }, { timeZone:"Europe/Paris", start:true });
			resolve( true );
		}
	})
}

function stop_cron( player_id ){
	return new Promise((resolve, reject)=>{		
		if( cron_manager.exists( player_id ) ){
			resolve(cron_manager.stop( player_id ));
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

module.exports={
    'convert_date_to_cron': convert_date_to_cron,
    'launch_cron': launch_cron,
    'stop_cron': stop_cron,
    'is_there_a_cron_active': is_there_a_cron_active,
    'all_active_cron': all_active_cron
};
