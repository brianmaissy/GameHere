var socket;
var game;
var players = {};
var h = 0;
var w = 0;
var radius;
var squareHeight;
var squareWidth;
var flashCounter = 0;

document.addEventListener("DOMContentLoaded", function(){
    // create the game and initialize things based on it
    game = createGame();
    var field = document.getElementById("field");
    w = field.offsetWidth;
    h = field.offsetHeight;
    squareHeight = h / game.fieldHeight;
    squareWidth = w / game.fieldWidth;
    radius = Math.min(squareWidth, squareHeight)/2;

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
    socket.on('disconnect', function(){
       game.stop();
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
    setInterval(tick, 40);
}, false);

function tick(){
    // tick the game
    game.tick(); //changes nextDirection
    // flip the flash counter
    flashCounter++;
    // update the display
    document.getElementById("field").innerHTML = '<div id="flash"></div>';
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
    // write the player list and scores
    var playerList = '';
    for(i=0; i< game.players.length; i++){
        playerList += '<span style="color:' + game.players[i].color + ';">' + game.players[i].name + ': ' + game.players[i].score + '</span><br>';
    }
    // draw the players
    for(i=0; i<game.players.length; i++){
        drawPlayer(game.players[i]);
    }
    document.getElementById("players").innerHTML = playerList;
    // draw the items
    for(i=0; i<game.items.length; i++){
        drawItem(game.items[i]);
    }
}

// draws a snake from scratch, square by square.
// future optimization: keep old snake divs and modify them appropriately
// and possibly combine squares into segments to use less divs
function drawPlayer(player){
    // create a div if it doesn't yet exist, then adjust its position and color
    drawSquare(player, player.segments[0], player.direction, 1-player.headProgress);
    for(var i=1; i<player.segments.length-1; i++){
        drawSquare(player, player.segments[i], "none", 0);
    }
    var tail = player.segments[player.segments.length-1];
    if(player.growing){
        drawSquare(player, tail, "none", 0);
    }else{
        drawSquare(player, tail, opposite(tail.direction), player.headProgress);
    }
}

// draws a snake square (and returns it)
function drawSquare(player, square, trimDirection, trimAmount){
    var div = document.createElement('div');
    div.setAttribute('class', 'playerSegment');
    div.style.backgroundColor = player.color;
    if(player.invincibilityTimeRemaining > 0){
        if((player.invincibilityTimeRemaining <= game.invincibilityTime / 4.0 && flashCounter % 2 == 0) ||
            (player.invincibilityTimeRemaining > game.invincibilityTime / 4.0 && flashCounter % 4 < 2))
                div.style.opacity = .25;
    }
    var w = squareWidth;
    var h = squareHeight;
    var l = square.x * squareWidth;
    var t = square.y * squareHeight;
    if(trimDirection == "left"){
        l += trimAmount * squareWidth;
        w -= trimAmount * squareWidth;
    }else if(trimDirection == "right"){
        w -= trimAmount * squareWidth;
    }else if(trimDirection == "up"){
        t += trimAmount * squareHeight;
        h -= trimAmount * squareHeight;
    }else if(trimDirection == "down"){
        h -= trimAmount * squareHeight;
    }
    div.style.width = w;
    div.style.height = h;
    div.style.left = l;
    div.style.top = t;
    document.getElementById("field").appendChild(div);
    return div;
}

function drawItem(item){
    var div = document.createElement('div');
    div.setAttribute('class', 'item');
    div.style.width = squareWidth-2;   // we want it to be slightly smaller than the square, the border keeps it centered
    div.style.height = squareHeight-2;
    div.style.borderRadius = radius;
    if(item.type == "food"){
        div.style.backgroundColor = "#FFFFFF";
    }else if(item.type == "invincibility"){
        div.style.backgroundColor = "#FF8800";
    }else if(item.type == "superfood"){
        div.style.backgroundColor = "#FF00FF";
    }else {
        div.style.backgroundColor = "#000000";
    }
    div.style.mozBorderRadius = radius;
    div.style.top = item.y * squareHeight;
    div.style.left = item.x * squareWidth;
    document.getElementById("field").appendChild(div);
}
