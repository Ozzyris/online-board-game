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
	- [x] update tab name with unread notification number.
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

- [x] The lobby is created after the first user is added to the lobby.
- [x] The number of current player is not accurate
- [x] The order of the lobby chat is inverted
- [x] I cannot send a message by pressing enter
- [x] There is no explaination about why I cannot start the game.
- [x] Enter the room by pressing Enter with your name
- [x] Can click twice on the launch game
- [x] Have the right url in the sharing block

- [x] What does happen if I arrived in the lobby when a game has already stared?
- [x] Redirect the user toward a 404 is the lobby have a wrond id
- [x] Clear user cache if opening a new game
- [x] Hold notification on until I return to the page.
- [x] Kick out bad url user
- [x] Allow user to leave game.

- [ ] Add desktop notification for:
	- [ ] start of a game
	- [ ] start of you turn
	- [ ] Vote

#### Board

- [x] Init board game
	- [x] Allow user to leave the game.
	- [x] Delete old games

- [x] Add admin action on the chat.
	- [x] Add the admin action logic
	- [x] Add the admin action admin security
	- [x] Add the admin action cheetset on the menu
	- [x] Admin command need to be done twice.

- [x] Display player's card
	- [x] Let the user show some card!
	- [ ] Add multiplicator

- [x] Start turn
	- [x] Update totem position
	- [x] Recovery player's turn (When page reload page, the turn should be the same)
	- [x] Next turn after every action

- [ ] In game action
	- [x] Add X elems of water by typing "Add 5 water"
	- [x] Admin skip player turn
	- [x] Make player sick
	- [x] Cure player
		-[x] Update game stats
	- [x] Kill someone
	 - [x] Update game stats
	 - [x] Gost message type
	 - [x] Dead user indicator
	- [ ] Leave the island

- [ ] End turn
	- [ ] Deduce food & water
	- [ ] Add a step to kill someone
	- [ ] Add a step to add food or water (game_states history)?

- [ ] Last turn
	- [ ] Winning player

- [ ] Create action type
	- [x] Action Pick up wood
	- [x] Action Pick up water
	- [x] Action Pick up food
	- [x] Action Pick up card
	- [x] Action skip turn (if sick or dead)

#### Bugs
- [x] The raft updated states wont save on the db?
- [x] The new-action-card wont launch the modal, nothing arrive on the front
- [x] An empty notification is sent when the raft is is updated
- [x] When a user has too many card, it break the organisation.
- [x] Certain screen the number are too high in height.
- [x] "Alex perso left the lobby" appearing at wrong time!
- [x] Escape empty chat box
- [x] Bug d'affichage sur ma tv pour la carte météo & raft
- [ ] when sick / cure / dead, don't allow to display card to the other player + update de modal card title
- [ ] Les timers des notifications sont ensemblent.
- [ ] Sometime showing a card is not working well.
- [ ] The user status is not update when reconnected.
- [ ] Loop who forces a player to keep playing.

