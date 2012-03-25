// The server ties the display together with the controllers. It does nothing interesting of its own,
// except mediating that interaction. There might be a more elegant way to do this using socket.io,
// but I haven't found it. I simply forward messages along, including a controllerID so the display
// knows where it came from.

var Bond = require("./static/bond").Bond;

var express = require("express");
var app = express.createServer();
app.configure(function() {
    app.use(express.bodyParser());
    app.use(express.static('./static/'));
    app.use(app.router);
});
app.set('view options', {
    layout: false
});

var port = 1337;
var io = require('socket.io').listen(app);
io.set('log level', 1);
app.listen(port);

var display;
var title;
var nextControllerID = 1;
var controllers = {};

io.sockets.on('connection', function (socket) {
    socket.on('newPlayer', function (data) {
        if(data.title == title){
            socket.set('controllerID', nextControllerID, function(){
                controllers[nextControllerID] = socket;
                data.controllerID = nextControllerID;
                if(display) display.emit('newPlayer', data);
                nextControllerID++;
            });
        }else{
            socket.emit('playerConnected', {title: data.title, error: "That game is not in progress. Are you using the correct controller?"});
        }
    });
    socket.on('playerConnected', function(data){
        if(!data.error) console.log('Player connected');
        controllers[data.controllerID].emit('playerConnected', {title: data.title, error: data.error});
    });
    socket.on('newDisplay', function(data) {
        display = socket;
        title = data.title;
        console.log(title + ' display connected');
        // set up the Bond debugger
        Bond.startRemoteServer(socket);
        Bond.start();
    });
    socket.on('disconnect', function() {
        socket.get('controllerID', function(err, controllerID){
            if (controllerID){
                if(display) display.emit('clientDisconnect', {controllerID: controllerID});
            }
        });
    });
    socket.on('move', function(data) {
        socket.get('controllerID', function(err, controllerID){
            if (controllerID){
                data.controllerID = controllerID;
                if(display) display.emit('move', data);
            }
        });
    });
    socket.on('pause', function(){
       if(display) display.emit('pause');
    });
	socket.on('touchstart' , function() {
		console.log('touchstart reached');
		
	});
});