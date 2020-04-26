import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

//services
import { ModalNameService } from '../../services/modals/modal_name/modal-name.service';
import { ActivityApiService } from '../../services/activity_api/activity_api.service';
import { ValidatorService } from '../../services/validator/validator.service';

@Component({
	selector: 'modal-wood',
	templateUrl: './modal_wood.directive.html',
	styleUrls: ['./modal_wood.directive.scss'],
	providers: [ActivityApiService]
})

export class ModalWoodDirective implements OnInit, OnDestroy{
	//Modal
	modal_subscription: Subscription;
	is_modal_active: Boolean = false;
	nb_of_more_wood: any = 0;

	// Game
	game_token: string;

	constructor( public activityApi_service: ActivityApiService, public modalName_service: ModalNameService, private validator_service: ValidatorService ){}
	ngOnInit(){
		this.modal_subscription = this.modalName_service.get_modal_status()
			.subscribe( modal_info => {
				if( modal_info.modal_id == 'wood' && modal_info.status == 'open' ){
					this.game_token = modal_info.game_token;
					this.is_modal_active = true;
				}else if( modal_info.modal_id == 'wood' && modal_info.status == 'close' ){
					this.is_modal_active = false;
				}
			});
	}

	get_wood(){
		this.modalName_service.nb_of_more_wood.next( this.nb_of_more_wood );			
		this.modalName_service.close_modal({ modal_id: 'wood', status: 'close' });
	}


	ngOnDestroy(){
		this.modal_subscription.unsubscribe();
	}
}
