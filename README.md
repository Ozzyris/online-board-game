# online-board-game
A way to play board game online to play during confinement.

### Status
> >Home : DONE
>
> >Lobby : WORK IN PROGRESS
>
> >Board : TO BE DONE

### Todo

##### Lobby
- [x] New player dosen't display their name
- [x] Remove player
- [x] If player removed how to get info for the message "user as left the lobby"
- [x] Kick user out player modale
- [x] If the admin leave the game is closed
- [x] Confirmation modal when the admin leave
- [x] Catch empty game and redirect user to home + toast
- [x] Si error dans token = pas de création de nouveau jeux
- [x] On disconnect : Unhandled rejection TypeError: Cannot read property 'name' of undefined
- [x] Let admin kicked out a user
	- [x] save socket id on user database
- [x] Limit username size
- [x] Create channel in io
- [x] Bug de online offline
- [x] Chat
- [x] Get the last 50 activities.
- [x] Activity
	- [x] display activites from socket io
	- [x] display activities from backend
- [x] Meilleur deconnexion
- [x] Amelioration des status en online & offline
- [x] Bug when sometime chat send doesn't go anywhere -> id in socket.player_id = undefined
- [x] Active user count
- [ ] Afficher un message avec cta pour recharger la page si je suis offline.

- [x] Shuffle the water cards
- [x] Shuffle the action cards
- [x] Shuffle player order
- [x] Init water & food
- [x] Order player by name
- [x] Move to next page

- [ ] Que ce passe t'il quand j'arrive sur le lobby et qu'un jeux à déjà commencé? 

#### Board

- [x] Init board game
- [ ] Add admin action on the chat.
	- [x] Add the admin action logic
	- [x] Add the admin action admin security
	- [ ] Add the admin action cheetset on the menu

- [ ] Display player's card

- [ ] Start turn
- [ ] End turn

- [ ] Last turn

- [ ] Action Pick up wood
- [x] Action Pick up water
- [x] Action Pick up food
- [x] Action Pick up card
- [ ] Action vote