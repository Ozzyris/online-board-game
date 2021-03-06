import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, Observable, Subject } from 'rxjs';

//Socket.io
import { io } from "socket.io-client";
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
	current_player: any = {
		player_status: "unknown",
	};
	players_details: any = [];
	leave_confirmation_subscription: Subscription;
	activities: any = [];
	player_online: any = {
		total: [],
		online: []
	}

	//Game
	game_states: any = {
		active_player: 'alex',
	};
	turns: any = Array(37).fill(1).map((x,i)=>i).reverse();
	raft_spot: any;
	wood_stock = Array(5).fill(1).map((x,i)=>i);
	current_water_card: any = {
		name: 'water',
		illustration: 'water_back.jpg',
		water_level: null
	};
	nb_of_more_wood: Subscription;

	//Chat
	chat_input: string = "";
	tab_active: boolean;
	unread_notification: number = 0;

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
					this.get_current_water_card(); 
				})
		})

		this.init_socket_io().subscribe();
	}

	check_game_started(){
		return new Promise((resolve, reject)=>{
			this.activityApi_service.get_game_status({ game_token: this.game_token })
				.subscribe( game_status => {
					resolve( game_status );
				});
		})
	}

	init_board(){
		return new Promise((resolve, reject)=>{
			this.get_elem_from_storage( 'game_' + this.game_token )
				.then( local_storage_data => {
					if( local_storage_data == null ){
						localStorage.removeItem( this.game_token );
						this.router.navigate(['/home', 'game-dont-exist']);
					}else{
						let local_storage = JSON.parse( local_storage_data ),
							player_id = local_storage.player_id;
						resolve( player_id );
					}
					
			})
		})	
	}

	init_socket_io(){
		let observable = new Observable(observer => {
			this.socket = io( environment.api_url );
			this.socket.on('handshake', (payload) => { observer.next(payload); this.handshake(payload); });
			this.socket.on('update-player-status', (payload) => { observer.next(payload); this.update_player_status(payload); });
			this.socket.on('new-activity', (activity) => { observer.next(activity); this.new_activity( activity ); });
			this.socket.on('leave-game', (payload) => { observer.next(payload); this.modalName_service.open_modal({ modal_id: 'banned', status: 'open'}); });
			this.socket.on('update-player-last-online-time', (payload) => { observer.next(payload); this.update_player_last_online_time( payload ); });
			//game
			this.socket.on('update-game-states', (game_states) => { observer.next(game_states); this.update_game_states( game_states ); });
			this.socket.on('new-toast', (payload) => { observer.next(payload); this.toaster_service.launch_toast({ message: payload.content }); });
			this.socket.on('new-water-card', (payload) => { observer.next(payload); this.update_water_card( payload );  });
			this.socket.on('update_active_player', (payload) => { observer.next(payload); this.active_player_update( payload );  });
			this.socket.on('new-action-card', (payload) => { observer.next(payload); console.log('alex'); console.log(payload); this.modalName_service.open_modal({ modal_id: 'card', status: 'open', payload: payload}); });
			this.socket.on('update_player_cards', (payload) => { observer.next(payload); this.update_player_cards( payload ); });
			this.socket.on('update_player_game_status', (payload) => { observer.next(payload); this.update_player_game_status( payload ); });
			this.socket.on('update-card-visibility', (payload) => { observer.next(payload); this.update_card_visibility( payload ); });
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
		this.activities.push( activity );
		this.denewsify_activity( activity.timestamp );
		if( this.tab_active == false ){
			this.unread_notification ++;
			if( this.unread_notification == 1){
				document.title = this.unread_notification + ' new activity - ☠️ Illegal - Gallerapagos ☠️';
			}
			else{
				document.title = this.unread_notification + ' new activities - ☠️ Illegal - Gallerapagos ☠️';
			}
			
		}
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

	get_current_water_card(){
		this.gameApi_service.get_current_water_card({ game_token: this.game_token })
			.subscribe( current_water_card => {
				this.update_water_card( current_water_card );
			});
	}

	update_water_card( water_card ){
		this.current_water_card = water_card;
	}

	active_player_update( payload ){
		this.game_states.active_player = payload.player_id;
	}

	update_player_cards( payload ){
		for (var i = this.players_details.length - 1; i >= 0; i--) {
			if( this.players_details[i]._id == payload.player_id ){
				this.players_details[i].game_detail.cards = payload.cards;
			}
		}
	}

	update_player_game_status( payload ){
		for (var i = this.players_details.length - 1; i >= 0; i--) {
			if( this.players_details[i]._id == payload.player_id ){
				this.players_details[i].game_detail.status = payload.status;
			}
		}
		if( this.current_player.player_id == payload.player_id ){
			this.current_player.player_status = payload.status;
		}
	}

	get_elem_from_storage( elem_name ): Promise<any>{
		return new Promise((resolve, reject)=>{
			resolve( localStorage.getItem( elem_name ) );
		})
	}

	remove_player(){
		this.modalName_service.open_modal({ modal_id: 'alert', status: 'open', title: 'Are you sure to leave this game?', content: 'Once the game is started, if you leave everyone will be kicked out.'});

		this.leave_confirmation_subscription = this.modalName_service.get_leave_confirmation()
			.subscribe( confirmation_to_leave => {
				this.activityApi_service.delete_lobby({ game_token: this.game_token })
					.subscribe( is_game_closed => {
						localStorage.clear();
						this.router.navigate(['/home']);
					}, error => {
						console.log( error );
					})
				this.leave_confirmation_subscription.unsubscribe();
			});
	}

	get_all_players_details(){
		this.activityApi_service.get_all_players_details({ game_token: this.game_token })
			.subscribe( players_details => {
				if( players_details == null || players_details.length == 0 ){
					localStorage.removeItem( this.game_token );
					this.router.navigate(['/home', 'game-dont-exist']);
				}else{
					this.players_details = players_details;
					this.init_player_number();
					this.init_current_player( players_details );
					this.get_last_50_activities();
					this.get_game_states();
					this.check_tab_visibility();
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
				this.current_player.player_status = players_details[i].game_detail.status;
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

	update_card_visibility( card_details ){
		for (var i = this.players_details.length - 1; i >= 0; i--) {
			if( this.players_details[i]._id == card_details.player_id ){
				for (var j = this.players_details[i].game_detail.cards.length - 1; j >= 0; j--) {
					if( this.players_details[i].game_detail.cards[j]._id == card_details.card_id ){
						this.players_details[i].game_detail.cards[j].visibility = card_details.card_visibility;
					}
				}
			}
		}
	}

	add_player_to_the_online_count( player_id , count){
		let index = this.player_online[count].indexOf( player_id );
		if (index == -1 && player_id != undefined) {
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
		let regex = /[a-zA-Z0-9!@#$%^&*]/g;
		if( this.chat_input == undefined || regex.test(this.chat_input) == false ){
			this.chat_input = '';
			return;
		}else{
			this.socket.emit('send-message', {content: this.chat_input, player_status: this.current_player.player_status});
			this.chat_input = '';
		}
	}

	check_tab_visibility(){
		document.addEventListener( "visibilitychange" , () => { 
			if (document.hidden) { 
				this.tab_active = false;
			}else{
				this.tab_active = true;
				this.unread_notification = 0;
				document.title = '☠️ Illegal - Gallerapagos ☠️';
			}
		});
	}

	get_water(){
		if( this.current_player.player_id == this.game_states.active_player ){
			this.gameApi_service.get_water({ game_token: this.game_token, player_id: this.current_player.player_id })
				.subscribe( does_player_got_water => {
					console.log(does_player_got_water);
				});
		}
	}

	get_food(){
		if( this.current_player.player_id == this.game_states.active_player ){
			this.gameApi_service.get_food({ game_token: this.game_token, player_id: this.current_player.player_id })
				.subscribe( does_player_got_food => {
					console.log(does_player_got_food);
				});
		}
	}
	get_card(){
		if( this.current_player.player_id == this.game_states.active_player ){
			this.gameApi_service.get_card({ game_token: this.game_token, player_id: this.current_player.player_id })
				.subscribe( does_player_got_card => {
					console.log(does_player_got_card);
				});
		}
	}
	get_wood(){
		if( this.current_player.player_id == this.game_states.active_player ){
			
			this.modalName_service.open_modal({ modal_id: 'wood', status: 'open'});
			this.nb_of_more_wood = this.modalName_service.get_nb_of_more_wood()
				.subscribe( nb_of_more_wood => {
					this.gameApi_service.get_wood({ game_token: this.game_token, player_id: this.current_player.player_id, more_wood: nb_of_more_wood })
						.subscribe( does_player_got_wood => {
							console.log(does_player_got_wood);
						});
					this.nb_of_more_wood.unsubscribe();
				});
		}
	}
	skip_turn(){
		if( this.current_player.player_id == this.game_states.active_player ){
			this.gameApi_service.skip_turn({ game_token: this.game_token, player_id: this.current_player.player_id })
				.subscribe( does_player_ski_turn => {
					console.log(does_player_ski_turn);
				});
		}
	}
}
