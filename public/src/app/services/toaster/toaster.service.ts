import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
	providedIn: 'root'
})

export class ToasterService {
	private is_toast_open = new Subject<any>();

	constructor(){}

	launch_toast( payload ) {
		this.is_toast_open.next( payload );
	}
	get_toaster_status(): Observable<any> {
		return this.is_toast_open;
	}
}