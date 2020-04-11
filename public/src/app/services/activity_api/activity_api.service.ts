import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
	providedIn: 'root'
})

export class ActivityApiService {
	base_url = environment.api_url + 'activity/';
	httpOptions: any;

	constructor( private http: HttpClient ){
		this.httpOptions = {
			headers: new HttpHeaders({
				'Content-Type':  'application/json'
			})
		};
	}

	create_lobby(){
		let url = this.base_url + 'create-lobby';
		return this.http.get(url, this.httpOptions);
	}

	delete_lobby( payload ){
		let url = this.base_url + 'delete-lobby';
		return this.http.post(url, payload, this.httpOptions);
	}

	add_player( payload ): Observable<any>{
		let url = this.base_url + 'add-player';
		return this.http.post(url, payload, this.httpOptions);
	}

	remove_player( payload ): Observable<any>{
		let url = this.base_url + 'remove-player';
		return this.http.post(url, payload, this.httpOptions);
	}

	get_all_players_details( payload ): Observable<any>{
		let url = this.base_url + 'get-all-players-details';
		return this.http.post(url, payload, this.httpOptions);
	}
}
