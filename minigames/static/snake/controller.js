var socket;
var name;
$(document).ready(function(){
    name = prompt("What is your name?", "anonymous");

    // start the socket.io connection and set up the handlers
    socket = io.connect('http://' + window.location.host);
    socket.on('connect', function(){
        $('div#message').html('Controller connected to server');
        socket.emit('newPlayer', {title: 'Snake', name: name});
    });
    socket.on('playerConnected', function(data){
        if(data.error){
            $('div#message').html('Error: ' + data.error);
            socket.disconnect();
        }else{
            $('div#message').html(data.title + ' controller connected to display as player ' + name);
        }
    });
});
$(document).keypress(function(event) {
    var deltaY = 0;
    var deltaX = 0;
    switch(parseInt(event.keyCode)){
        case 37: //left arrow
		case 97:
            deltaX = -1;
            break;
        case 38: //up arrow
		case 119:
            deltaY = -1;
            break;
        case 39: //right arrow
		case 100:
            deltaX = 1;
            break;
        case 40: //down arrow
		case 115:
            deltaY = 1;
            break;
        case 0:
            if(event.charCode == 112) socket.emit('pause');
            break;
        default:
            return;
    }
    if(deltaY != 0 || deltaX != 0){
        socket.emit('move', {x: deltaX, y: deltaY});
    }
});

//TODO: add touch input
var dir = false;
var startY = 0;
var startX = 0;
var moveY = 0;
var moveX = 0;
var moveThreshold = 50;
var deltaX = 0;
var deltaY = 0;

document.addEventListener('touchstart', function(e) {
    startY = e.touches[0].pageY;
	startX = e.touches[0].pageX;
});
document.addEventListener('touchmove', function(e) {
    moveY = e.touches[0].pageY;
	moveX = e.touches[0].pageX;
    if(Math.abs(moveY - startY) > moveThreshold) {
        dir = (moveY > startY) ? 'down' : 'up';
        if (dir == 'up')
        {
			deltaX = 0;
            deltaY = -1;			
        }
        else
        {
			deltaX = 0;	
            deltaY = 1;
        }
    } else if(Math.abs(moveX - startX) > moveThreshold) {
        dir = (moveX > startX) ? 'right' : 'left';
        if (dir == 'left')
        {
            deltaX = -1;
			deltaY = 0;
        }
        else
        {
            deltaX = 1;
			deltaY = 0;
        }
    }
    else { //doesnt pass threshold
		deltaY = 0;
		deltaX = 0;
    }
    socket.emit('move', {x: deltaX, y: deltaY});
});
document.addEventListener('touchend', function(e) {
    deltaY = 0;
	deltaX = 0;
    socket.emit('move', {x: deltaX, y: deltaY});
});

function blockMove() {
	event.preventDefault();
}

