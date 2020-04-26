import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})

export class ModalNameService {
	private is_modal_name_open = new Subject<any>();
	public player_id = new Subject<any>();
	public leave_confirmation = new Subject<any>();
	public nb_of_more_wood = new Subject<any>();

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
	get_leave_confirmation(): Observable<any> {
		return this.leave_confirmation;
	}
	get_nb_of_more_wood(): Observable<any> {
		return this.nb_of_more_wood;
	}
}
