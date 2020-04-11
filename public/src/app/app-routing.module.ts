import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

//VIEWS
import { HomeComponent } from './views/home/home.component';
import { LobbyComponent } from './views/lobby/lobby.component';
import { BoardComponent } from './views/board/board.component';


const routes: Routes = [
	{ path: '',   redirectTo: 'home', pathMatch: 'full' },
	{ path: 'home/:info', component: HomeComponent, data: { title: 'Illegal Galerapagos' } },
	{ path: 'home', component: HomeComponent, data: { title: 'Illegal Galerapagos' } },
	{ path: 'lobby/:game_token', component: LobbyComponent, data: { title: 'Lobby' } },
	{ path: 'board', component: BoardComponent, data: { title: 'Board' } },
	{ path: '**', redirectTo: 'home' },
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})

export class AppRoutingModule{}
