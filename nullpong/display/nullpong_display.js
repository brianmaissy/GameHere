window.addEventListener('load', function(event) {
    var socket = io.connect('http://localhost:9000');
    var playerA = document.getElementById('playerA');
    var playerB = document.getElementById('playerB');
    socket.on('locations', function(locations) {
        if(locations.length >= 2) {
            playerA.style.webkitTransform = 'translate3d(100px, ' + locations[0] + 'px, 0px)';
            playerB.style.webkitTransform = 'translate3d(500px, ' + locations[1] + 'px, 0px)';
        }
    });
});
