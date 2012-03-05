// The Multipong game
var Multipong = exports;
Multipong.title = 'MultiPong';

// The player object
function Player(name){
    this.name = name;
    this.x = 0;
    this.y = 0;
}

// utility function, temporary until users can choose their own names
function randomString() {
	var chars = "abcdefghiklmnopqrstuvwxyz";
	var string_length = 8;
	var randomstring = '';
	for (var i=0; i<string_length; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum,rnum+1);
	}
	return randomstring;
}

// stores the players
// TODO: push players all the way to the outside edges of the board
var leftPlayers = [];
var rightPlayers = [];

// to add or remove players, we update the player arrays and the x values of all players
Multipong.newPlayer = function(){
    var player = new Player(randomString());
    if (leftPlayers.length > rightPlayers.length){
        player.x = rightPlayers.length + 1;
        rightPlayers.push(player);
    }else{
        player.x = -leftPlayers.length - 1;
        leftPlayers.push(player);
    }
    return player;
}
// when players leave, all players outside of them on their side move up
Multipong.removePlayer = function(player){
    var index = leftPlayers.indexOf(player);
    if (index >= 0){
        leftPlayers.splice(index, 1);
        for(i=0; i < leftPlayers.length; i++){
            leftPlayers[i].x = -i - 1;
        }
    }else{
        index = rightPlayers.indexOf(player);
        rightPlayers.splice(index, 1);
        for(i=0; i < rightPlayers.length; i++){
            rightPlayers[i].x = i + 1;
        }
    }
}

// returns all connected players, for updating the clients
Multipong.players = function(){
    return leftPlayers.concat(rightPlayers);
}
