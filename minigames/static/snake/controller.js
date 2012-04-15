var socket;
var name;
var itemMode = "use";
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
    socket.on('inventory', function(data){
        drawInventory(data);
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
        case 112:
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
var moveThreshold = 20;
var deltaX = 0;
var deltaY = 0;

document.addEventListener('touchstart', function(e) {
    startY = e.touches[0].pageY;
	startX = e.touches[0].pageX;
});
document.addEventListener('touchmove', function(e) {
    moveY = e.touches[0].pageY;
	moveX = e.touches[0].pageX;
    if(Math.abs(moveY - startY) > moveThreshold && Math.abs(moveY - startY) > Math.abs(moveX - startX)) {
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

function drawInventory(inventory){
    var inv = document.getElementById('inventory');
    inv.innerHTML = "";
    for(var i=0; i<inventory.length; i++){
        var item = inventory[i];
        var div = document.createElement('div');
        div.setAttribute('class', 'item');
        var container = document.createElement('div');
        container.setAttribute('class', 'itemContainer');
        div.style.backgroundColor = getItemColor(item.type);
        container.item = item;
        container.onmousedown = clickItem;
        container.appendChild(div);
        inv.appendChild(container);
    }
}

function clickItem(){
    if(itemMode == "drop") {
        socket.emit('dropItem', {item: this.item});
    } else {
        socket.emit('useItem', {item: this.item});
    }
}

function toggleItemMode(){
    if(itemMode == "use"){
        itemMode = "drop";
        document.getElementById("itemMode").innerHTML = "Click on items to drop them. [SWITCH TO USE MODE]";
        document.getElementById("inventory").style.backgroundColor = "red";
    } else if(itemMode == "drop"){
        itemMode = "use";
        document.getElementById("itemMode").innerHTML = "Click on items to use them. [SWITCH TO DROP MODE]";
        document.getElementById("inventory").style.backgroundColor = "transparent";
    }
}