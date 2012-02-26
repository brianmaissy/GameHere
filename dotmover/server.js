var express = require("express");
var ejs = require("ejs");

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

var sockets = false;

if(sockets){
    var io = require('socket.io').listen(app);
}
app.listen(8888);

var xPos = 0;
var yPos = 0;

app.get('/', function(req, res){
    res.render('index', {
        x: xPos,
        y: yPos,
        sockets: sockets
    });
});

if(sockets){
    io.sockets.on('connection', function (socket) {
        socket.on('location', function (data) {
            socket.emit('location', { x: xPos, y: yPos });
        });
        socket.on('nudge', function (data) {
            xPos += data.x;
            yPos += data.y;
            socket.emit('location', { x: xPos, y: yPos });
        });
        socket.on('move', function (data) {
            xPos = data.x;
            yPos = data.y;
            socket.emit('location', { x: xPos, y: yPos });
        });
    });
}else{
    app.get('/location', function(req, res){
        res.render('update', {
            x: xPos,
            y: yPos
        });
    });
    app.post('/nudge', function(req, res){
        xPos += 10*parseInt(req.param('x', 0));
        yPos += 10*parseInt(req.param('y', 0));
        res.render('update', {
            x: xPos,
            y: yPos
        });
    });
    app.post('/move', function(req, res){
        xPos = parseInt(req.param('x', 0));
        yPos = parseInt(req.param('y', 0));
        res.render('update', {
            x: xPos,
            y: yPos
        });
    });
}
