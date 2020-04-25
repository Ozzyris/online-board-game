import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
	providedIn: 'root'
})

export class GameApiService {
	base_url = environment.api_url + 'game/';
	httpOptions: any;
	
	constructor( private http: HttpClient ){
		this.httpOptions = {
			headers: new HttpHeaders({
				'Content-Type':  'application/json'
			})
		};
	}

	launch_game( payload ): Observable<any>{
		let url = this.base_url + 'launch-game';
		return this.http.post(url, payload, this.httpOptions);
	}

	get_game_states( payload ): Observable<any>{
		let url = this.base_url + 'get-game-states';
		return this.http.post(url, payload, this.httpOptions);
	}

	get_water( payload ): Observable<any>{
		let url = this.base_url + 'get-water';
		return this.http.post(url, payload, this.httpOptions);
	}
}
