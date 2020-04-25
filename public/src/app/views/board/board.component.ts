import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, Observable, Subject } from 'rxjs';

//Socket.io
import * as io from 'socket.io-client';
import { environment } from '../../../environments/environment';

//Services
import { ActivityApiService } from '../../services/activity_api/activity_api.service';
import { GameApiService } from '../../services/game_api/game-api.service';
import { ToasterService } from '../../services/toaster/toaster.service';
import { ModalNameService } from '../../services/modals/modal_name/modal-name.service';

@Component({
	selector: 'app-board',
	templateUrl: './board.component.html',
	styleUrls: ['./board.component.scss'],
	providers: [ActivityApiService, GameApiService]
})

export class BoardComponent implements OnInit {
	//Activity
	game_token: string;
	current_player: any = {};
	players_details: any = [];
	activities: any = [];
	player_online: any = {
		total: [],
		online: []
	}

	//Game
	game_states: any = {};
	turns: any = Array(37).fill(1).map((x,i)=>i).reverse();
	raft_spot: any;
	wood_stock = Array(5).fill(1).map((x,i)=>i);
	current_water_card: any = {
		name: 'water',
		illustration: 'water_back.jpg',
		water_level: null
	};
	active_player: string;

	//Chat
	chat_input: string = "/admin: start turn";

	//Socket.io
	private socket;

	constructor( public activityApi_service: ActivityApiService, public gameApi_service: GameApiService, public toaster_service: ToasterService, public modalName_service: ModalNameService, private route: ActivatedRoute, private router: Router ){}
	ngOnInit(){
		this.route.params.subscribe( params => {
			this.game_token = params.game_token;

			this.init_board()
				.then( player_id => {
					this.current_player.player_id = player_id;
					this.get_all_players_details(); 
				})
		})

		this.init_socket_io().subscribe();
	}

	init_socket_io(){
		let observable = new Observable(observer => {
			this.socket = io.connect( environment.api_url );
			this.socket.on('handshake', (payload) => { observer.next(payload); this.handshake(payload); });
			this.socket.on('update-player-status', (payload) => { observer.next(payload); this.update_player_status(payload); });
			this.socket.on('new-activity', (activity) => { observer.next(activity); this.new_activity( activity ); });
			this.socket.on('update-player-last-online-time', (payload) => { observer.next(payload); this.update_player_last_online_time( payload ); });
			//game
			this.socket.on('update-game-states', (game_states) => { observer.next(game_states); this.update_game_states( game_states ); });
			this.socket.on('new-toast', (payload) => { observer.next(payload); this.toaster_service.launch_toast({ message: payload.content }); });
			this.socket.on('new-water-card', (payload) => { observer.next(payload); this.update_water_card( payload );  });
			this.socket.on('current_player', (payload) => { observer.next(payload); this.current_player_io( payload );  });
			this.socket.on('new-action-card', (payload) => { observer.next(payload); this.modalName_service.open_modal({ modal_id: 'card', status: 'open', payload: payload});   });
			this.socket.on('update_player_cards', (payload) => { observer.next(payload); this.update_player_cards( payload ); });
			return () => { this.socket.disconnect(); }; 
		})
		return observable;
	}

	handshake( message ){
		this.toaster_service.launch_toast({ message: message.content });
		this.socket.emit('reconnect-player', {'game_token': this.game_token, 'player_id': this.current_player.player_id});
	}

	update_player_status( payload ){
		if( payload.status == 'online'){
			this.add_player_to_the_online_count(payload.player_id, 'online');
		}
		if( payload.status == 'inactive' || payload.status == 'offline'){
			this.remove_player_to_the_online_count(payload.player_id, 'online');
		}
		for (var i = this.players_details.length - 1; i >= 0; i--) {
			if( this.players_details[i]._id == payload.player_id ){
				this.players_details[i].status = payload.status;
			}
		}
	}

	new_activity( activity ){
		this.activities.unshift( activity );
		this.denewsify_activity( activity.timestamp );
	}

	denewsify_activity(timestamp){
		setTimeout(()=>{
			for (var i = this.activities.length - 1; i >= 0; i--) {
				if(this.activities[i].timestamp == timestamp){
					this.activities[i].status = '';
				}
			}
		},30000);
	}

	update_player_last_online_time( payload ){
		for (var i = this.players_details.length - 1; i >= 0; i--) {
			if( this.players_details[i]._id == payload.player_id ){
				this.players_details[i].last_online_time = payload.last_online_time;
			}
		}
	}

	update_water_card( water_card ){
		this.current_water_card = water_card;
	}

	current_player_io( payload ){
		this.active_player = payload.player_id;
	}

	update_player_cards( payload ){
		for (var i = this.players_details.length - 1; i >= 0; i--) {
			if( this.players_details[i]._id == payload.player_id ){
				this.players_details[i].game_detail.cards = payload.cards;
			}
		}
	}

	init_board(){
		return new Promise((resolve, reject)=>{
			this.get_elem_from_storage( 'player_id' )
				.then( player_id => {
					if( player_id == null ){
						console.log('player_id is not in storage')
					}else{
						resolve( player_id );
					}
					
			})
		})	
	}

	get_elem_from_storage( elem_name ): Promise<any>{
		return new Promise((resolve, reject)=>{
			resolve( localStorage.getItem( elem_name ) );
		})
	}

	get_all_players_details(){
		this.activityApi_service.get_all_players_details({ game_token: this.game_token })
			.subscribe( players_details => {
				if( players_details == null ){
					localStorage.clear();
					this.router.navigate(['/home', 'game-dont-exist']);
				}else{
					this.players_details = players_details;
					this.init_player_number();
					this.init_current_player( players_details );
					this.get_last_50_activities();
					this.get_game_states()
				}
			})
	}

	init_player_number(){
		for (var i = this.players_details.length - 1; i >= 0; i--) {
			if(this.players_details[i].status == 'online') this.add_player_to_the_online_count(this.players_details[i]._id, 'online');
			this.add_player_to_the_online_count(this.players_details[i]._id, 'total');
		}
		this.raft_spot = Array( this.players_details.length ).fill(1).map((x,i)=>i);
	}

	init_current_player(players_details){
		for (var i = players_details.length - 1; i >= 0; i--) {
			if( players_details[i]._id == this.current_player.player_id ){
				this.current_player.name = players_details[i].name;
				this.current_player.rank = players_details[i].rank;
				this.socket.emit('connect-player', {'game_token': this.game_token, 'player_id': this.current_player.player_id});
			}
		}
	}

	get_last_50_activities(){
		this.activityApi_service.get_last_50_activities({ game_token: this.game_token })
			.subscribe( last_50_activities => {
				this.activities = last_50_activities;
			});
	}

	get_game_states(){
		this.gameApi_service.get_game_states({ game_token: this.game_token })
			.subscribe( game_states => {
				this.game_states = game_states;
			});
	}

	update_game_states( game_states ){
		this.game_states = game_states;
	}

	add_player_to_the_online_count( player_id , count){
		let index = this.player_online[count].indexOf( player_id );
		if (index == -1) {
			this.player_online[count].push( player_id );
		}
	}

	remove_player_to_the_online_count( player_id , count){
		let index = this.player_online[count].indexOf( player_id );
		if (index > -1) {
			this.player_online[count].splice(index, 1);
		}
	}

	send_chat(){
		if( this.chat_input == undefined ){
			console.log('empty');
			return;
		}
		
		this.socket.emit('send-message', {content: this.chat_input});
		this.chat_input = '/admin: start turn';
	}

	get_water(){
		if( this.current_player.player_id == this.active_player ){
			this.gameApi_service.get_water({ game_token: this.game_token, player_id: this.current_player.player_id })
				.subscribe( does_player_got_water => {
					console.log(does_player_got_water)
				});
		}
	}

	get_food(){
		if( this.current_player.player_id == this.active_player ){
			this.gameApi_service.get_food({ game_token: this.game_token, player_id: this.current_player.player_id })
				.subscribe( does_player_got_food => {
					console.log(does_player_got_food)
				});
		}
	}
	get_card(){
		if( this.current_player.player_id == this.active_player ){
			this.gameApi_service.get_card({ game_token: this.game_token, player_id: this.current_player.player_id })
				.subscribe( does_player_got_card => {
					console.log(does_player_got_card)
				});
		}
	}
}
