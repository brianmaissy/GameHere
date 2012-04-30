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
	initTouch();
	initOrientation();
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

var dir = false;
var startY = 0;
var startX = 0;
var moveY = 0;
var moveX = 0;
var moveThreshold = 20;
var deltaX = 0;
var deltaY = 0;

function touchHandler(event)
{
    var touches = event.changedTouches,
        first = touches[0],
        type = "";
 
    switch(event.type)
    {
        case "touchstart": 
			type = "mousedown"; 
			//dotouchStart(event); 
			break;
        case "touchmove":  
			type="mousemove"; 
			//dotouchMove(event);
			break;
        case "touchend":
   			type="mouseup"; 
			//dotouchEnd(event);
			break;
        default: return;
    }
    var simulatedEvent = document.createEvent("MouseEvent");
    simulatedEvent.initMouseEvent(type, true, true, window, 1,
                              first.screenX, first.screenY,
                              first.clientX, first.clientY, false,
                              false, false, false, 0/*left*/, null);
 
    first.target.dispatchEvent(simulatedEvent);
    event.preventDefault();
}

function doTouchStart(e){
	startY = e.touches[0].pageY;
	startX = e.touches[0].pageX;		
}

function doTouchMove(e){
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
}

function doTouchEnd(e){
	deltaY = 0;
	deltaX = 0;
    socket.emit('move', {x: deltaX, y: deltaY});
	
}
 
function initTouch()
{
	document.addEventListener("touchstart", touchHandler, true);
	document.addEventListener("touchmove", touchHandler, true);
	document.addEventListener("touchend", touchHandler, true);
	document.addEventListener("touchcancel", touchHandler, true);

	var touchArea = document.getElementById('touchArea');
	touchArea.addEventListener("touchstart", doTouchStart, true);
	touchArea.addEventListener("touchmove", doTouchMove, true);
	touchArea.addEventListener("touchend", doTouchEnd, true);
}

var rotateThreshold = 10;
var d;

function orientationHandler(event) {
	event.preventDefault();

	var fb = event.beta;
	var lr = event.gamma;

	if(lr > rotateThreshold) {
		deltaX = 1;
		deltaY = 0;
	}
	else if(lr < -rotateThreshold) {
		deltaX = -1;
		deltaY = 0;
	}
	else if(fb > rotateThreshold) {
		deltaX = 0;
		deltaY = 1;
	}
	else if(fb < -rotateThreshold) {
		deltaX = 0;
		deltaY = -1;
	}
	else {
		deltaX = 0;
		deltaY = 0;
	}
    socket.emit('move', {x: deltaX, y: deltaY});

}

function initOrientation()
{
	window.addEventListener('deviceorientation', orientationHandler, true);
}

function drawInventory(inventory){
    var inv = document.getElementById('inventory');
    inv.innerHTML = "";

    for(var i=0; i<inventory.length; i++){
        var item = inventory[i];

		var div = document.createElement('div');
		div.setAttribute('class', 'item');
		div.setAttribute('id', 'id'+i);
		div.style.backgroundColor = getItemColor(item.type);
		
		var container = document.createElement('div');
		container.setAttribute('class', 'itemContainer');
		container.item = item;
        container.onmouseup = clickItem;
        container.appendChild(div);
        inv.appendChild(container);
		$('#id'+i).draggable({revert:true});
    }
}

function doNothing(){
	console.log("do nothing");
}

// Precondition: view inside clip
function Scrollview(view) {
	var pos = 0;
	var startX = 0;
	var diffX = 0;
	var timetouched = 0;
	var timePassed = 0;

	view.addEventListener('touchstart', function(event) {
		startX = event.touches[0].pageX;
		timetouched = new Date().getTime();
		console.log("start touch:",timetouched);
	});
	view.addEventListener('touchmove', function(event) {
		var currX = event.touches[0].pageX;
		diffX = currX - startX;
		this.style.webkitTransform = 'translate3d(' + (pos + diffX) + 'px, 0px, 0px)';
		
		timePassed = new Date().getTime() - timetouched;
		if (timePassed > 200)
		{
			var container = document.getElementsByClassName('itemContainer');
			for (var i = 0; i < container.length; i++)
			{
				if (container[i].onmouseup != dropItem) {
					container[i].onmouseup = doNothing;
				} else {
					console.log("doNothing is not set");
					console.log("onmouseup:", container[i].onmouseup);
				}
				
			}
		}
	});
	view.addEventListener('touchend', function(event) {
		pos = pos + diffX;
		var container = document.getElementsByClassName('itemContainer');
		for (var i = 0; i < container.length; i++)
		{
			container[i].onmouseup = clickItem;
		}
	});
}


function clickItem(){
    socket.emit('useItem', {item: this.item});
}

function dropItem(){
	socket.emit('dropItem', {item: this.item});	
}
