import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, Observable, Subject } from 'rxjs';

//Socket.io
import { io } from "socket.io-client";
import { environment } from '../../../environments/environment';

//Services
import { ActivityApiService } from '../../services/activity_api/activity_api.service';
import { GameApiService } from '../../services/game_api/game-api.service';
import { ModalNameService } from '../../services/modals/modal_name/modal-name.service';
import { ToasterService } from '../../services/toaster/toaster.service';


@Component({
	selector: 'app-lobby',
	templateUrl: './lobby.component.html',
	styleUrls: ['./lobby.component.scss'],
	providers: [ActivityApiService, GameApiService]
})

export class LobbyComponent implements OnInit {
	//Activity
	game_token: string;
	share_link: string;
	player_id_subscription: Subscription;
	leave_confirmation_subscription: Subscription;
	current_player: any = {}
	players_details: any = [];
	player_online: any = {
		total: [],
		online: []
	}
	activities: any = [];
	is_game_launch_game: boolean = false;

	//Chat
	chat_input: string;
	tab_active: boolean;
	unread_notification: any = [];


	//Socket.io
	private socket;

	//pipe
	pipe_updater: any; //Force the pipe to re-rendre when new element is added.

	constructor( public activityApi_service: ActivityApiService, public gameApi_service: GameApiService, public modalName_service: ModalNameService, public toaster_service: ToasterService, private route: ActivatedRoute, private router: Router ){}
	ngOnInit(){
		this.route.params.subscribe( params => {
			this.game_token = params.game_token;
			this.share_link = environment.public_url + "lobby/" + this.game_token;
			this.check_game_started()
				.then( game_status => {
					if( game_status == "started"){
						localStorage.removeItem( this.game_token );
						this.router.navigate(['/home', 'game-dont-exist']);
					}else{
						return this.init_lobby();
					}
				})
				.then( player_id => {
					this.current_player.player_id = player_id;
					this.get_all_players_details(); 
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

	init_lobby(){
		return new Promise((resolve, reject)=>{
			this.get_elem_from_storage( 'game_' + this.game_token )
				.then( local_storage_data => {
					if( local_storage_data == null ){
						this.modalName_service.open_modal({game_token: this.game_token, modal_id: 'name', status: 'open'});
						this.player_id_subscription = this.modalName_service.get_player_id()
							.subscribe( player_id_from_back => {
								resolve( player_id_from_back );
								this.player_id_subscription.unsubscribe();
							});
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
			this.socket.on('update-player', (player) => { observer.next(player); this.update_player( player ); });
			this.socket.on('update-player-last-online-time', (payload) => { observer.next(payload); this.update_player_last_online_time( payload ); });
			this.socket.on('leave-game', (payload) => { observer.next(payload); this.modalName_service.open_modal({ modal_id: 'banned', status: 'open'}); });
			this.socket.on('launch-game', (payload) => { observer.next(payload); this.router.navigate(['/board', this.game_token]); });
			return () => { this.socket.disconnect(); }; 
		})
		return observable;
	}

	handshake( message ){
		this.toaster_service.launch_toast({ message: message.content });
		this.socket.emit('reconnect-player', {'game_token': this.game_token, 'player_id': this.current_player.player_id});
	}

	get_last_50_activities(){
		this.activityApi_service.get_last_50_activities({ game_token: this.game_token })
			.subscribe( last_50_activities => {
				this.activities = last_50_activities;
			});
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
		if( this.tab_active == false ){
			this.unread_notification.push(activity.timestamp);
			if( this.unread_notification.length == 1){
				document.title = this.unread_notification.length + ' new activity - ☠️ Illegal - Gallerapagos ☠️';
			}
			else{
				document.title = this.unread_notification.length + ' new activities - ☠️ Illegal - Gallerapagos ☠️';
			}
		}else{
			this.denewsify_activity( activity.timestamp );
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

	update_player( payload ){
		if(payload.type == 'add-player'){
			this.add_player_to_the_online_count(payload.player_details._id, 'total');
			this.players_details.push(payload.player_details);
			this.pipe_updater = new Date();
		}else if(payload.type == 'remove-player'){
			this.remove_player_to_the_online_count(payload.player_id, 'total');
			this.remove_player_to_the_online_count(payload.player_id, 'online');
			for (var i = this.players_details.length - 1; i >= 0; i--) {
				if( this.players_details[i]._id == payload.player_id ){
					this.players_details.splice(i, 1);
				}
			}
		}
	}

	update_player_last_online_time( payload ){
		for (var i = this.players_details.length - 1; i >= 0; i--) {
			if( this.players_details[i]._id == payload.player_id ){
				this.players_details[i].last_online_time = payload.last_online_time;
			}
		}
	}

	get_all_players_details(){
		this.activityApi_service.get_all_players_details({ game_token: this.game_token })
			.subscribe( players_details => {
				if( players_details == null || players_details.length == 0){
					localStorage.removeItem( this.game_token );
					this.router.navigate(['/home', 'game-dont-exist']);
				}else{
					this.players_details = players_details;
					this.init_player_number();
					this.init_current_player( players_details );
					this.get_last_50_activities();
					this.check_tab_visibility();
				}
			})
	}

	init_player_number(){
		for (var i = this.players_details.length - 1; i >= 0; i--) {
			if(this.players_details[i].status == 'online') this.add_player_to_the_online_count(this.players_details[i]._id, 'online');
			this.add_player_to_the_online_count(this.players_details[i]._id, 'total');
		}
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

	get_elem_from_storage( elem_name ): Promise<any>{
		return new Promise((resolve, reject)=>{
			resolve( localStorage.getItem( elem_name ) );
		})
	}

	remove_player(){
		if( this.current_player.rank == "administrator" ){
			this.modalName_service.open_modal({ modal_id: 'alert', status: 'open', title: 'Are you sure to leave this game?', content: 'As administrator of this game, if you leave everyone will be kicked out of the game.'});

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
			
		}else{
			this.activityApi_service.remove_player({ game_token: this.game_token, player_id: this.current_player.player_id })
				.subscribe( is_player_removed => {
					localStorage.clear();
					this.router.navigate(['/home']);
				}, error => {
					console.log( error );
				})
		}
	}

	kick_out_player( player_id, player_name ){
		this.modalName_service.open_modal({ modal_id: 'alert', status: 'open', title: 'Are you sure to kick out ' + player_name + ' ?', content: 'As administrator of this game, kicking out ' + player_name + ' will force him/her out of the game for good.'});

		this.leave_confirmation_subscription = this.modalName_service.get_leave_confirmation()
			.subscribe( confirmation_to_leave=> {
				this.activityApi_service.remove_player({ game_token: this.game_token, player_id: player_id, kicked_out: true })
					.subscribe( is_player_removed => {
					
						this.toaster_service.launch_toast({ message: player_name + ' has been kicked out' });
					}, error => {
						console.log( error );
					});
					
					this.leave_confirmation_subscription.unsubscribe();
			});
	}

	copy_to_clipboard(){
		const temp_textarea = document.createElement('textarea');
		temp_textarea.style.position = 'fixed';
		temp_textarea.style.left = '0';
		temp_textarea.style.top = '0';
		temp_textarea.style.opacity = '0';
		temp_textarea.value = this.share_link;
		document.body.appendChild(temp_textarea);
		temp_textarea.focus();
		temp_textarea.select();
		document.execCommand('copy');
		document.body.removeChild(temp_textarea);

		this.toaster_service.launch_toast({ message: 'Le lien de partage à été copié' });
	}

	send_chat(){
		let regex = /[a-zA-Z0-9!@#$%^&*]/g;
		if( this.chat_input == undefined || regex.test(this.chat_input) == false ){
			this.chat_input = '';
			return;
		}else{
			this.socket.emit('send-message', {content: this.chat_input});
			this.chat_input = '';
		}
	}

	add_player_to_the_online_count(player_id , count){
		let index = this.player_online[count].indexOf( player_id );
		if (index == -1 && player_id != undefined) {
			this.player_online[count].push( player_id );
		}
	}

	remove_player_to_the_online_count(player_id , count){
		let index = this.player_online[count].indexOf( player_id );
		if (index > -1) {
			this.player_online[count].splice(index, 1);
		}
	}

	launch_game(){
		if( this.player_online.total.length > 2 && this.is_game_launch_game == false){
			this.is_game_launch_game = true;
			this.gameApi_service.launch_game({ game_token: this.game_token })
				.subscribe( is_game_launched => {
				}, error => {
					console.log( error );
				})
		}
	}

	check_tab_visibility(){
		document.addEventListener( "visibilitychange" , () => { 
			if (document.hidden) { 
				this.tab_active = false;
			}else{
				this.tab_active = true;
				for (var i = this.unread_notification.length - 1; i >= 0; i--) {
					this.denewsify_activity( this.unread_notification[i] );
				}
				this.unread_notification = [];
				document.title = '☠️ Illegal - Gallerapagos ☠️';
			}
		});
	}
}
