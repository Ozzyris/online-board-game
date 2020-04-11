import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

//Services
import { ActivityApiService } from '../../services/activity_api/activity_api.service';
import { ToasterService } from '../../services/toaster/toaster.service';


@Component({
	selector: 'app-home',
	templateUrl: './home.component.html',
	styleUrls: ['./home.component.scss'],
    providers: [ActivityApiService]
})

export class HomeComponent implements OnInit {

	constructor( public activityApi_service: ActivityApiService, private route: ActivatedRoute, public toaster_service: ToasterService, private router: Router ){}
	ngOnInit(){
		this.route.params.subscribe( params => {
			if( params.info == 'game-dont-exist'){
				setTimeout(()=>{
					this.toaster_service.launch_toast({ message: 'This game doest exist' });
				}, 1000);
			}
		})
	}

	create_lobby(){
		this.activityApi_service.create_lobby()
			.subscribe( game_token => {
				this.router.navigate(['/lobby', game_token]);
			})
	}
}
