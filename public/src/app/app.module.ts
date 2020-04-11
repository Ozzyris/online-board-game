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

//DIRECTIVES
import { ModalNameDirective } from './directives/modal_name/modal_name.directive';
import { ModalPlayerDirective } from './directives/modal_player/modal_player.directive';
import { ToasterDirective } from './directives/toaster/toaster.directive';

@NgModule({
	declarations: [
		AppComponent,
		HomeComponent,
		LobbyComponent,
		BoardComponent,
		SanitizerPipe,
		ModalNameDirective,
		ModalPlayerDirective,
		ToasterDirective
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
