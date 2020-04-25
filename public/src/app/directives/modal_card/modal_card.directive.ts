import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

//services
import { ModalNameService } from '../../services/modals/modal_name/modal-name.service';

@Component({
	selector: 'modal-card',
	templateUrl: './modal_card.directive.html',
	styleUrls: ['./modal_card.directive.scss']
})

export class ModalCardDirective implements OnInit, OnDestroy{
	is_modal_active: Boolean = false;
	modal_subscription: Subscription;
	card_info: any;

	constructor( public modalName_service: ModalNameService ){}
	ngOnInit(){
		this.modal_subscription = this.modalName_service.get_modal_status()
			.subscribe( modal_info => {
				if( modal_info.modal_id == 'card' && modal_info.status == 'open' ){
					this.is_modal_active = true;
					this.card_info = modal_info.payload;

					console.log( this.card_info );
				}else if( modal_info.modal_id == 'card' && modal_info.status == 'close' ){
					this.is_modal_active = false;
				}
			});
	}
	ngOnDestroy(){
		this.modal_subscription.unsubscribe();
	}
}
