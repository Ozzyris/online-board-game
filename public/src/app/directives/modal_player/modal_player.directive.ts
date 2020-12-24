import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

//services
import { ModalNameService } from '../../services/modals/modal_name/modal-name.service';

@Component({
	selector: 'modal-player',
	templateUrl: './modal_player.directive.html',
	styleUrls: ['./modal_player.directive.scss']
})

export class ModalPlayerDirective implements OnInit, OnDestroy{
	//Modal
	modal_subscription: Subscription;
	is_modal_active: Boolean = false;
	player_details: any;
	current_player_id: string;
	active_player: string;

	constructor( public modalName_service: ModalNameService ){}
	ngOnInit(){
		this.modal_subscription = this.modalName_service.get_modal_status()
			.subscribe( modal_info => {
				this.active_player = modal_info.active_player;
				this.current_player_id = modal_info.current_player_id;
				this.player_details = modal_info.player_details;
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
}
