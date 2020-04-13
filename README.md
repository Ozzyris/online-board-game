# online-board-game
A way to play board game online to play during confinement.

### Status
> non fonctionnel

### Todo
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
- [ ] Activity
	- [x] display activites from socket io
	- [ ] display activities from backend
- [ ] Meilleur deconnexion
- [ ] Amelioration des status en online & offline
- [ ] Get the last 50 activities. (stream like observable) when connected to the server (handshake)