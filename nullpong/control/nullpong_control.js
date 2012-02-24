window.addEventListener('load', function(event) {
    var socket = io.connect('http://localhost:9000');
    
    var body = document.body;
    var fingerDown = false;
    var dir = false;
    var startY = 0;
    var moveY = 0;
    var moveThreshold = 10;

    socket.emit('player', '');
    socket.on('ready', function(playerno) {
        var playerLabel = document.getElementById('playerLabel');
        playerLabel.innerHTML = 'Player ' + playerno;
        setInterval(function() {
            if(dir) {
                socket.emit('move', dir);
            }
        }, 100);
    });
    body.addEventListener('touchstart', function(e) {
        fingerDown = true;
        dir = false;
        startY = e.touches[0].pageY;
    });
    body.addEventListener('touchmove', function(e) {
        moveY = e.touches[0].pageY;
        if(Math.abs(moveY - startY) > moveThreshold) {
            dir = (moveY > startY) ? 'down' : 'up';
        }
        else {
            dir = false;
        }
    });
    body.addEventListener('touchend', function(e) {
        fingerDown = false;
        dir = false;
    });
});
