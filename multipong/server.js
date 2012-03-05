var express = require("express");
var ejs = require("ejs");
var game = require("./multipong");

var app = express.createServer();
app.configure(function() {
    app.use(express.bodyParser());
    app.use(express.static('./static/'));
    app.use(app.router);
});
app.set('view engine', 'ejs');
app.set('view options', {
    layout: false
});
app.use(express.bodyParser());

var port = 1337;
var io = require('socket.io').listen(app);
app.listen(port);

var display;
function updateDisplay(){
    if(display){
        console.log("Updating display");
        display.emit('update', {players: game.players()});
    }
}

app.get('/controller', function(req, res){
    res.render('controller', {
        game: game
    });
});

app.get('/display', function(req, res){
    res.render('display', {
        game: game
    });
});

io.sockets.on('connection', function (socket) {
    socket.on('newPlayer', function () {
        player = game.newPlayer();
        socket.set('player', player, function(){
            console.log("Player " + player.name + " connected");
            updateDisplay();
            socket.emit('playerConnected', {name: player.name});
        });
    });
    socket.on('newDisplay', function() {
        console.log("Display connected");
        display = socket;
        updateDisplay();
    });
    socket.on('disconnect', function() {
        socket.get('player', function(err, player){
            if (player){
                game.removePlayer(player);
                console.log("Player " + player.name + " disconnected");
                updateDisplay();
            }
        });
    });
    socket.on('move', function(data) {
        socket.get('player', function(err, player){
            if (player){
                player.y += data.y;
                updateDisplay();
            }
        });
    });
});
