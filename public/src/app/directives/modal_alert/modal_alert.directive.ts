import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

//services
import { ModalNameService } from '../../services/modals/modal_name/modal-name.service';

@Component({
	selector: 'modal-alert',
	templateUrl: './modal_alert.directive.html',
	styleUrls: ['./modal_alert.directive.scss']
})

export class ModalAlertDirective implements OnInit, OnDestroy{
	//Modal
	modal_subscription: Subscription;
	is_modal_active: Boolean = false;

	// Var
	title: string;
	content: string;


	constructor( public modalName_service: ModalNameService ){}
	ngOnInit(){
		this.modal_subscription = this.modalName_service.get_modal_status()
			.subscribe( modal_info => {
				if( modal_info.modal_id == 'alert' && modal_info.status == 'open' ){
					this.title = modal_info.title;
					this.content = modal_info.content;
					this.is_modal_active = true;
				}else if( modal_info.modal_id == 'alert' && modal_info.status == 'close' ){
					this.is_modal_active = false;
				}
			});
	}
	ngOnDestroy(){
		this.modal_subscription.unsubscribe();
	}

	confirmation(){
		this.modalName_service.leave_confirmation.next( true );
		this.modalName_service.close_modal({ modal_id: 'alert', status: 'close' });
	}
}
