import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

//services
import { ModalNameService } from '../../services/modals/modal_name/modal-name.service';
import { ToasterService } from '../../services/toaster/toaster.service';

@Component({
	selector: 'modal-admin-cheetset',
	templateUrl: './modal_admin_cheetset.directive.html',
	styleUrls: ['./modal_admin_cheetset.directive.scss']
})

export class ModalAdminCheetsetDirective implements OnInit, OnDestroy{
	//Modal
	modal_subscription: Subscription;
	is_modal_active: Boolean = false;

	constructor( public modalName_service: ModalNameService, public toaster_service: ToasterService ){}
	ngOnInit(){
		this.modal_subscription = this.modalName_service.get_modal_status()
			.subscribe( modal_info => {
				if( modal_info.modal_id == 'admin_cheetset' && modal_info.status == 'open' ){
					this.is_modal_active = true;
				}else if( modal_info.modal_id == 'admin_cheetset' && modal_info.status == 'close' ){
					this.is_modal_active = false;
				}
			});
	}
	ngOnDestroy(){
		this.modal_subscription.unsubscribe();
	}

	copied( content ){
		const temp_textarea = document.createElement('textarea');
		temp_textarea.style.position = 'fixed';
		temp_textarea.style.left = '0';
		temp_textarea.style.top = '0';
		temp_textarea.style.opacity = '0';
		temp_textarea.value = content;
		document.body.appendChild(temp_textarea);
		temp_textarea.focus();
		temp_textarea.select();
		document.execCommand('copy');
		document.body.removeChild(temp_textarea);

		this.toaster_service.launch_toast({ message: 'Le lien de partage à été copié' });
	}

	close(){
		this.is_modal_active = false;
	}
}
