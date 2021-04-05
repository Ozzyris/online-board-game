import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';


//services
import { ModalNameService } from '../../services/modals/modal_name/modal-name.service';

@Component({
	selector: 'modal-inexistant',
	templateUrl: './modal_inexistant.directive.html',
	styleUrls: ['./modal_inexistant.directive.scss']
})

export class ModalInexistantDirective implements OnInit, OnDestroy{
	//Modal
	modal_subscription: Subscription;
	is_modal_active: Boolean = false;

	constructor( public modalName_service: ModalNameService ){}
	ngOnInit(){
		this.modal_subscription = this.modalName_service.get_modal_status()
			.subscribe( modal_info => {
				if( modal_info.modal_id == 'inexistant' && modal_info.status == 'open' ){
					this.is_modal_active = true;
				}else if( modal_info.modal_id == 'inexistant' && modal_info.status == 'close' ){
					this.is_modal_active = false;
				}
			});
	}
	ngOnDestroy(){
		this.modal_subscription.unsubscribe();
	}

	leave_game(){
		localStorage.clear();
	}
}
