var uuid = require('uuid/v4'),
	Promise = require('bluebird'),
	moment = require('moment');

function create_token(){
	return uuid();
}

function create_code(){
   var result           = '';
   var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789%*@#§';
   var charactersLength = characters.length;
   for ( var i = 0; i < 4; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}

function check_if_token_is_valid( token_details ){
	return new Promise((resolve, reject)=>{
		resolve( moment.unix(token_details.expiration_date/1000).isAfter() );
	})
}

module.exports={
    'create_token': create_token,
    'create_code': create_code,
    'check_if_token_is_valid': check_if_token_is_valid,
}