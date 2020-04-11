import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

//services
import { ModalNameService } from '../../services/modals/modal_name/modal-name.service';
import { ActivityApiService } from '../../services/activity_api/activity_api.service';

@Component({
	selector: 'modal-name',
	templateUrl: './modal_name.directive.html',
	styleUrls: ['./modal_name.directive.scss'],
	providers: [ActivityApiService]
})

export class ModalNameDirective implements OnInit, OnDestroy{
	//Modal
	modal_subscription: Subscription;
	is_modal_active: Boolean = false;

	// Input
	input_player_name: string;
	info_player_name: string = '';

	// Game
	game_token: string;

	constructor( public activityApi_service: ActivityApiService, public modalName_service: ModalNameService ){}
	ngOnInit(){
		this.modal_subscription = this.modalName_service.get_modal_status()
			.subscribe( modal_info => {
				if( modal_info.modal_id == 'name' && modal_info.status == 'open' ){
					this.game_token = modal_info.game_token;
					this.is_modal_active = true;
				}else if( modal_info.modal_id == 'name' && modal_info.status == 'close' ){
					this.is_modal_active = false;
				}
			});
	}
	ngOnDestroy(){
		this.modal_subscription.unsubscribe();
	}

	add_player(){
		this.info_player_name = '';

		if( this.input_player_name == undefined ){
			this.info_player_name = 'This field is required';
		}else{
			this.activityApi_service.add_player({ game_token: this.game_token, player_name: this.input_player_name })
				.subscribe( is_player_added => {
					localStorage.setItem('player_id', is_player_added.player_id );
					this.modalName_service.player_id.next( is_player_added.player_id );
					this.modalName_service.close_modal({ modal_id: 'name', status: 'close' });

				}, error => {
					this.info_player_name = error.error.message;
				})
		}
	}
}
