var socket;
var game;
var players = {};
var h = 0;
var w = 0;
var squareHeight;
var squareWidth;
document.addEventListener("DOMContentLoaded", function(){
    // create the game and initialize things based on it
    game = createGame();
    var field = document.getElementById("field");
    w = field.offsetWidth;
    h = field.offsetHeight;
    squareHeight = h / game.fieldHeight;
    squareWidth = w / game.fieldWidth;
    var food = document.getElementById("food");
    food.style.width = squareWidth-2;   // we want it to be slightly smaller than the square
    food.style.height = squareHeight-2;
    var radius = Math.min(squareWidth-2, squareHeight-2)/2;
    food.style.borderRadius = radius;
    food.style.mozBorderRadius = radius;
    food.style.display = "none";

    // start the socket.io connection and set up the handlers
    socket = io.connect('http://' + window.location.host);
    // the display's own connection handshake
    socket.on('connect', function(){
        document.getElementById("message").innerHTML = 'Display connected to server';
        socket.emit('newDisplay', {title: game.title});
    });
    // a new controller has connected through the server, create a player for it
    socket.on('newPlayer', function(data){
        players[data.controllerID] = game.newPlayer(data.name);
        if(players[data.controllerID]){
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
    // motion input from a controller through the server
    socket.on('move', function(data){
        // ignore it if the message is from a controllerID that doesn't correspond to one of our players
        if(players[data.controllerID]){
            if(!game.paused) players[data.controllerID].move(data);
        }
    });
    socket.on('pause', function(){
        game.pause();
    });
    // set up the Bond debugger
    Bond.startRemoteClient(socket);

    // start ticking away
    setInterval(tick, 200);
}, false);

function tick(){
    // tick the game
    game.tick(); //changes nextDirection
    // update the display
    var i;
    // update the flash
    var flash = document.getElementById("flash");
    if(game.paused){
        flash.innerHTML = "PAUSED";
    }else if(game.starting){
        flash.innerHTML = "GET READY";
    }else{
        flash.innerHTML = "";
    }
    // write the playerlist and scores
    var playerList = '';
    for(i=0; i< game.players.length; i++){
        playerList += '<span style="color:' + game.players[i].color + ';">' + game.players[i].name + ': ' + game.players[i].score + '</span><br>';
    }
    // draw the players
    var players = document.getElementsByClassName("player");
    if(players.length > 0){
        for(i=0; i<players.length; i++){
            players[i].style.display = "none";
        }
    }
    for(i=0; i<game.players.length; i++){
        drawPlayer(game.players[i], i);
    }
    document.getElementById("players").innerHTML = playerList;
    // draw the food
    for(i=0; i<game.food.length; i++){
        drawFood(game.food[i]);
    }
}

function drawPlayer(player, number){
    // just draws the full head square for now. TODO: draw entire snake, including partial head and tail
    // create a div if it doesn't yet exist, then adjust its position and color
    var div = document.getElementById(number);
    if(!div){
        div = document.createElement('div');
        div.setAttribute('class', 'playerSegment');
        div.setAttribute('id', number);
        div.style.height = squareHeight;
        div.style.width = squareWidth;
        div.style.top = player.controlSquares.last().y * squareHeight;
        div.style.left = player.controlSquares.last().x * squareWidth;
        document.getElementById("field").appendChild(div);
    }
	console.log("top:",div.style.top);
	console.log("left:",div.style.left);
    div.style.backgroundColor = player.color;
    div.style.display = "block";
    div.style.top = player.controlSquares.last().y * squareHeight;
    div.style.left = player.controlSquares.last().x * squareWidth;

}

function drawFood(food){
    var div = document.getElementById("food");
    div.style.top = food.y * squareHeight + 1; // it is slightly smaller than the square, but we want it centered
    div.style.left = food.x * squareWidth + 1;
    div.style.display = "block";
}
