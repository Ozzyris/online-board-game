import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

//Services
import { ActivityApiService } from '../../services/activity_api/activity_api.service';
import { ModalNameService } from '../../services/modals/modal_name/modal-name.service';



@Component({
	selector: 'app-home',
	templateUrl: './home.component.html',
	styleUrls: ['./home.component.scss'],
    providers: [ActivityApiService]
})

export class HomeComponent implements OnInit {

	constructor( public activityApi_service: ActivityApiService, private route: ActivatedRoute, public modalName_service: ModalNameService, private router: Router ){}
	ngOnInit(){
		this.route.params.subscribe( params => {
			if( params.info == 'game-dont-exist'){
				setTimeout(()=>{
					this.modalName_service.open_modal({modal_id: 'inexistant', status: 'open'});
				}, 1000);
			}
		})
	}

	create_lobby(){
		localStorage.clear();
		
		this.activityApi_service.create_lobby()
			.subscribe( game_token => {
				this.router.navigate(['/lobby', game_token]);
			})
	}
}
