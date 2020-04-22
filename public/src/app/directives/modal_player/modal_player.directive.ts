import { Component, OnInit, OnDestroy } from '@angular/core';
// import { Subscription } from 'rxjs';

//services
// import { ModalService } from '../../services/modal/modal.service';

@Component({
	selector: 'modal-player',
	templateUrl: './modal_player.directive.html',
	styleUrls: ['./modal_player.directive.scss']
})

export class ModalPlayerDirective implements OnInit, OnDestroy{
	is_modal_active: Boolean = false;
	// modal_subscription: Subscription;

	constructor(){}
	ngOnInit(){
		// this.modal_subscription = this.modal_service.get_modal_status().subscribe(
		// 	is_modal_open => {
		// 		this.is_modal_active = is_modal_open.status;
		// 		this.active_article = this.experiment[is_modal_open.id];
		// 	});
	}
	ngOnDestroy(){
		// this.modal_subscription.unsubscribe();
	}
}
