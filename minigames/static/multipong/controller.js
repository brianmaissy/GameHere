var socket;
var name;
$(document).ready(function(){
    name = prompt("What is your name?", "anonymous");

    // start the socket.io connection and set up the handlers
    socket = io.connect('http://' + window.location.host);
    socket.on('connect', function(){
        $('div#message').html('Controller connected to server');
        socket.emit('newPlayer', {title: 'Multipong', name: name});
    });
    socket.on('playerConnected', function(data){
        if(data.error){
            $('div#message').html('Error: ' + data.error);
            socket.disconnect();
        }else{
            $('div#message').html(data.title + ' controller connected to display as player ' + name);
        }
    });
    initOrientation();
});

var rotateThreshold = 20;

function orientationHandler(event) {
	event.preventDefault();

	var fb = event.beta;

	if(fb > rotateThreshold) {
		deltaY = 1;
	}
	else if(fb < -rotateThreshold) {
		deltaY = -1;
	}
	else {
		deltaY = 0;
	}
    socket.emit('move', {y: deltaY});

}

function initOrientation()
{
	window.addEventListener('deviceorientation', orientationHandler, true);
}

$(document).keypress(function(event) {
    var deltaY = 0;
    switch(parseInt(event.keyCode)){
        case 38: //up arrow
        case 97: //numpad1
            deltaY = -1;
            break;
        case 40:  //down arrow
        case 122: //f11
            deltaY = 1;
            break;
        case 0:
            if(event.charCode == 112) socket.emit('pause');
            break;
        default:
            return;
    }
    if(deltaY != 0){
        socket.emit('move', {y: deltaY});
    }
});


//TODO: add touch input
var dir = false;
var startY = 0;
var moveY = 0;
var moveThreshold = 50;
var deltaY = 0;

document.addEventListener('touchstart', function(e) {
    startY = e.touches[0].pageY;
});
document.addEventListener('touchmove', function(e) {
    moveY = e.touches[0].pageY;
    if(Math.abs(moveY - startY) > moveThreshold) {
        dir = (moveY > startY) ? 'down' : 'up';
        if (dir == 'up')
        {
            deltaY = -1;
        }
        else
        {
            deltaY = 1;
        }
    }
    else {
        deltaY = 0;
    }
    socket.emit('move', {y: deltaY});
});
document.addEventListener('touchend', function(e) {
    deltaY = 0;
    socket.emit('move', {y: deltaY});
});

function blockMove() {
	event.preventDefault();
}
