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
- [ ] On disconnect : Unhandled rejection TypeError: Cannot read property 'name' of undefined
    at game_model.update_activity_status.then.then.player (/Users/alexandre/Documents/Project/online-board-game/server/helpers/io_activity_helper.js:54:41)j
- [ ] Let admin kicked out a user
- [ ] Si error dans token = pas de création de nouveau jeux
- [ ] Bug de online offline
- [ ] Amelioration des status en online & offline
- [ ] create channel in io
- [ ] meilleur deconnexion
- [ ] get the last 50 activities. (stream like observable) when connected to the server (handshake)