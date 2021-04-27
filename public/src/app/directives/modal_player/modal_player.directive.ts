import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

//services
import { ModalNameService } from '../../services/modals/modal_name/modal-name.service';
import { GameApiService } from '../../services/game_api/game-api.service';
import { ToasterService } from '../../services/toaster/toaster.service';

@Component({
	selector: 'modal-player',
	templateUrl: './modal_player.directive.html',
	styleUrls: ['./modal_player.directive.scss'],
	providers: [GameApiService]
})

export class ModalPlayerDirective implements OnInit, OnDestroy{
	//Modal
	modal_subscription: Subscription;
	is_modal_active: Boolean = false;
	player_details: any;
	current_player: string;
	active_player: string;
	game_token: string;

	constructor( public modalName_service: ModalNameService, public gameApi_service: GameApiService, public toaster_service: ToasterService ){}
	ngOnInit(){
		this.modal_subscription = this.modalName_service.get_modal_status()
			.subscribe( modal_info => {
				this.active_player = modal_info.active_player;
				this.current_player = modal_info.current_player;
				this.player_details = modal_info.player_details;
				this.game_token = modal_info.game_token;

				if( modal_info.modal_id == 'modal-player' && modal_info.status == 'open' ){
					this.is_modal_active = true;
				}else if( modal_info.modal_id == 'modal-player' && modal_info.status == 'close' ){
					this.is_modal_active = false;
				}
			});
	}
	ngOnDestroy(){
		this.modal_subscription.unsubscribe();
	}
	update_card_visibility( current_player_id, card_details ){
		let payload = {
			player_id: current_player_id,
			card_visibility: card_details.visibility == 'hidden' ? 'visible' : 'hidden',
			card_id: card_details._id,
			game_token: this.game_token
		}
		this.gameApi_service.update_card_visibility( payload )
			.subscribe( is_card_updated => {
				this.toaster_service.launch_toast({ message: 'This card id now ' +  payload.card_visibility});
			}, error => {
				console.log(error);
			})
	}
}
