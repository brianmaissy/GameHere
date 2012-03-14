var express = require("express");
var game = require("./multipong").createGame();

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
io.set('log level', 1);
app.listen(port);

var display;
function updateDisplay(){
    if(display){
        display.emit('update', {state: game.state()});
    }
}
function tick(){
    game.tick();
    updateDisplay();
}
setInterval(tick, 10);


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
    socket.on('newPlayer', function () {    // TODO: let players choose their own names and give them unique colors
        player = game.newPlayer();
        socket.set('player', player, function(){
            console.log("Player " + player.name + " connected");
            socket.emit('playerConnected', {name: player.name});
        });
    });
    socket.on('newDisplay', function() {
        console.log("Display connected");
        display = socket;
    });
    socket.on('disconnect', function() {
        socket.get('player', function(err, player){
            if (player){
                game.removePlayer(player);
                console.log("Player " + player.name + " disconnected");
            }
        });
    });
    socket.on('move', function(data) {
        socket.get('player', function(err, player){
            if (player){
                player.move(data);
            }
        });
    });
});
