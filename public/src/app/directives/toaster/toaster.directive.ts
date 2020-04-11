import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

//services
import { ToasterService } from '../../services/toaster/toaster.service';

@Component({
	selector: 'toaster',
	templateUrl: './toaster.directive.html',
	styleUrls: ['./toaster.directive.scss']
})

export class ToasterDirective implements OnInit, OnDestroy{
	toaster_message: string;
	is_toaster_active: Boolean = false;
	toaster_subscription: Subscription;

	constructor( public toaster_service: ToasterService ){}
	ngOnInit(){
		this.toaster_subscription = this.toaster_service.get_toaster_status()
			.subscribe( toaster_content => {
				console.log( toaster_content.message );
				this.toaster_message = toaster_content.message;
				this.is_toaster_active = true;
				setTimeout(()=>{
					this.is_toaster_active = false;
				}, 5000);
			});
	}
	ngOnDestroy(){
		this.toaster_subscription.unsubscribe();
	}
}
