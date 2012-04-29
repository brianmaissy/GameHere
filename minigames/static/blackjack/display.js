var socket;
var game;
var players = {};
var h = 0;
var w = 0;
var disabled;

document.addEventListener("DOMContentLoaded", function(){
    // create the game and initialize things based on it
    game = createGame();
    var table = document.getElementById('table');
    w = table.offsetWidth;
    h = table.offsetHeight;

    // start the socket.io connection and set up the handlers
    socket = io.connect('http://' + window.location.host);
    // the display's own connection handshake
    socket.on('connect', function(){
        if(!disabled){
            document.getElementById("message").innerHTML = 'Display connected to server';
            socket.emit('newDisplay', {title: game.title});
        }
    });
    // a new controller has connected through the server, create a player for it
    socket.on('newPlayer', function(data){
        var player = game.newPlayer(data.name);
        if(player){
            player.controllerID = data.controllerID;
            players[data.controllerID] = player;
            var hand = player.hand;
            socket.emit('playerConnected', {controllerID: data.controllerID, title: game.title});
        }else{
            socket.emit('playerConnected', {controllerID: data.controllerID, error: "too many players"});
        }
    });
    // a client has disconnected from the server
    socket.on('clientDisconnect', function(data){
        if(game.players.indexOf(players[data.controllerID]) >= 0){
            game.removePlayer(players[data.controllerID]);
        }
    });
    socket.on('disconnect', function(){
        document.getElementById("message").innerHTML = 'Display disconnected from server';
        document.getElementById("flash").innerHTML = "GAME OVER";
        disabled = true;
    });
    // input from a controller through the server
    socket.on('bet', function(data){
        // ignore it if the message is from a controllerID that doesn't correspond to one of our players
        var player = players[data.controllerID];
        if(player){
            player.bet(data.amount);
            if(game.allPlayersHaveBet()){
                game.deal();
                var i, len = game.players.length;
                for(i = 0; i < len; i++){
                    var pl = game.players[i];
                    var hand = pl.hand;
                    socket.emit('cards', {controllerID: pl.controllerID, cards: hand, total: game.handValue(hand)});
                }
                socket.emit('startHitting');
                redraw();
            }
        }
    });
    socket.on('hit', function(data){
        // ignore it if the message is from a controllerID that doesn't correspond to one of our players
        var player = players[data.controllerID];
        if(player){
            players[data.controllerID].hit();
            var hand = player.hand;
            socket.emit('cards', {controllerID: player.controllerID, cards: hand, total: game.handValue(hand)});
            if(game.allPlayersDoneHitting()){
                game.finish();
                socket.emit('startBetting');
            }
        }
    });
    socket.on('stand', function(data){
        // ignore it if the message is from a controllerID that doesn't correspond to one of our players
        var player = players[data.controllerID];
        if(player){
            players[data.controllerID].stand();
            if(game.allPlayersDoneHitting()){
                game.finish();
                socket.emit('startBetting');
            }
        }
    });
    // set up the Bond debugger
    Bond.startRemoteClient(socket);
}, false);

function redraw(){
    //TODO: finish this
};