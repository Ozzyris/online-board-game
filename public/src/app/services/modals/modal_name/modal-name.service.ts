import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})

export class ModalNameService {
	private is_modal_name_open = new Subject<any>();
	public player_id = new Subject<any>();

	constructor(){}

	open_modal( payload ) {
		this.is_modal_name_open.next( payload );
	}
	close_modal( payload ){
		this.is_modal_name_open.next( payload );
	}
	get_modal_status(): Observable<any> {
		return this.is_modal_name_open;
	}
	get_player_id(): Observable<any> {
		return this.player_id;
	}
}
