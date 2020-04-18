import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, Observable, forkJoin, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

//Socket.io
import * as io from 'socket.io-client';
import { environment } from '../../../environments/environment';

//Services
import { ActivityApiService } from '../../services/activity_api/activity_api.service';
import { ModalNameService } from '../../services/modals/modal_name/modal-name.service';
import { ToasterService } from '../../services/toaster/toaster.service';


@Component({
	selector: 'app-lobby',
	templateUrl: './lobby.component.html',
	styleUrls: ['./lobby.component.scss'],
	providers: [ActivityApiService]
})

export class LobbyComponent implements OnInit, OnDestroy {
	//Activity
	game_token: string;
	share_link: string;
	player_id_subscription: Subscription;
	leave_confirmation_subscription: Subscription;
	current_player: any = {}
	players_details: any = [];

	activities: any = [];
	activity_subscription = new Subject<any>();

	//chat
	chat_input: string;

	//Socket.io
	private socket;


	constructor( public activityApi_service: ActivityApiService, public modalName_service: ModalNameService, public toaster_service: ToasterService, private route: ActivatedRoute, private router: Router ){}
	ngOnInit(){
		this.route.params.subscribe( params => {
			this.game_token = params.game_token;
			this.share_link = "http://192.168.0.11:4200/lobby/" + this.game_token;
			this.init_lobby()
				.then( player_id => {
					this.current_player.player_id = player_id;
					this.get_all_players_details(); 
				})
		})

		this.init_socket_io().subscribe();
	}
	ngOnDestroy(){}

	init_socket_io(){
		let observable = new Observable(observer => {
			this.socket = io.connect( environment.api_url );
			this.socket.on('handshake', (payload) => { observer.next(payload); this.handshake(payload); });
			this.socket.on('update-player-status', (payload) => { observer.next(payload); this.update_player_status(payload); });
			this.socket.on('new-activity', (activity) => { observer.next(activity); this.new_activity( activity ); });
			this.socket.on('update-player', (player) => { observer.next(player); this.update_player( player ); });
			this.socket.on('leave-game', (payload) => { observer.next(payload); this.modalName_service.open_modal({ modal_id: 'banned', status: 'open'}); });
			return () => { this.socket.disconnect(); console.log('disconnect'); }; 
		})
		return observable;
	}

	handshake( message ){
		this.toaster_service.launch_toast({ message: message.content });
		this.get_last_50_activities();
	}
	get_last_50_activities(){
		this.activityApi_service.get_last_50_activities({ game_token: this.game_token })
			.subscribe( last_50_activities => {
				this.activities = last_50_activities;
			});
	}

	update_player_status( payload ){
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
	update_player( payload ){
		if(payload.type == 'add-player'){
			this.players_details.push(payload.player_details);
		}else if(payload.type == 'remove-player'){
			for (var i = this.players_details.length - 1; i >= 0; i--) {
				if( this.players_details[i]._id == payload.player_id ){
					this.players_details.splice(i, 1);
				}
			}
		}
	}
	init_lobby(){
		return new Promise((resolve, reject)=>{
			this.get_elem_from_storage( 'player_id' )
				.then( player_id => {
					if( player_id == null ){
						this.modalName_service.open_modal({game_token: this.game_token, modal_id: 'name', status: 'open'});
						this.player_id_subscription = this.modalName_service.get_player_id()
							.subscribe( player_id_from_back => {
								resolve( player_id_from_back );
								this.player_id_subscription.unsubscribe();
							});
					}else{
						resolve( player_id );
					}
					
			})
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
					this.init_current_player( players_details);
				}
			})
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
		//player_id | game_token
		return new Promise((resolve, reject)=>{
			resolve( localStorage.getItem( elem_name ) );
		})
	}

	remove_player(){
		if( this.current_player.rank == "administrator" ){
			this.modalName_service.open_modal({ modal_id: 'alert', status: 'open', title: 'Are you sure to leave this game?', content: 'As administrator of this game, if you leave everyone will be kicked out of the game.'});

			this.leave_confirmation_subscription = this.modalName_service.get_leave_confirmation()
				.subscribe( confirmation_to_leave=> {
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
		if( this.chat_input == undefined ){
			console.log('empty');
			return;
		}
		
		this.socket.emit('send-message', {content: this.chat_input});
		this.chat_input = undefined;
	}
}
