import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

//Services
import { ActivityApiService } from '../../services/activity_api/activity_api.service';

@Component({
	selector: 'app-home',
	templateUrl: './home.component.html',
	styleUrls: ['./home.component.scss'],
    providers: [ActivityApiService]
})

export class HomeComponent implements OnInit {

	constructor( public activityApi_service: ActivityApiService, private router: Router ){}
	ngOnInit(){}

	create_lobby(){
		this.activityApi_service.create_lobby()
			.subscribe( game_token => {
				this.router.navigate(['/lobby', game_token]);
			})
	}
}
