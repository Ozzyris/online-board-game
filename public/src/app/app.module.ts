//INTERNAL PACKAGE
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClientJsonpModule } from '@angular/common/http';

//EXTERNAL PACKAGE
import { MomentModule } from 'angular2-moment';

//VIEWS
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { HomeComponent } from './views/home/home.component';
import { LobbyComponent } from './views/lobby/lobby.component';
import { BoardComponent } from './views/board/board.component';

//PIPES
import { SanitizerPipe } from './pipes/sanitizer/sanitizer.pipe';
import { SortByDatePipe } from './pipes/sort_by_date/sort-by-date.pipe';

//DIRECTIVES
import { ModalAdminCheetsetDirective } from './directives/modal_admin_cheetset/modal_admin_cheetset.directive';
import { ModalAlertDirective } from './directives/modal_alert/modal_alert.directive';
import { ModalBannedDirective } from './directives/modal_banned/modal_banned.directive';
import { ModalCardDirective } from './directives/modal_card/modal_card.directive';
import { ModalNameDirective } from './directives/modal_name/modal_name.directive';
import { ModalPlayerDirective } from './directives/modal_player/modal_player.directive';
import { ModalWoodDirective } from './directives/modal_wood/modal_wood.directive';
import { ToasterDirective } from './directives/toaster/toaster.directive';
import { SortbyPipe } from './pipes/sort_by/sort-by.pipe';

@NgModule({
	declarations: [
		AppComponent,
		HomeComponent,
		LobbyComponent,
		BoardComponent,
		SanitizerPipe,
		ModalAdminCheetsetDirective,
		ModalAlertDirective,
		ModalBannedDirective,
		ModalCardDirective,
		ModalNameDirective,
		ModalPlayerDirective,
		ModalWoodDirective,
		ToasterDirective,
		SortByDatePipe,
		SortbyPipe
	],
	imports: [
		BrowserModule,
		AppRoutingModule,
    	FormsModule,
    	MomentModule,
    	HttpClientModule,
   		HttpClientJsonpModule,
	],
	providers: [],
	bootstrap: [AppComponent]
})
export class AppModule { }
