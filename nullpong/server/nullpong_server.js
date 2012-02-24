/* nullpong -- Absurdist Pong
 * ==========================
 * Server Code
 * Author: Mark Lu
 */

var io = require('socket.io').listen(9000);

var players = [];
var locations = [];

io.sockets.on('connection', function(socket) {
	
	// all clients must identify themselves first
	socket.on('player', function(data) {
		// insert into first available slot
		var i = 0;
		while(players[i]) i++;
		players[i] = this;
		socket.set('type', 'player');
        locations[i] = 0;
		socket.set('playerno', i, function() {
			socket.emit('ready', i);
		});
	});

	socket.on('disconnect', function() {
		socket.get('type', function(err, type) {
			if(type == 'player') {
				socket.get('playerno', function(err, playerno) {
					players[playerno] = undefined;
				});
			}
		});
	});

	socket.on('move', function(dir) {
		socket.get('playerno', function(err, playerno) {
			if(dir == 'up') {
				locations[playerno] -= 10;
			}
			else {
				locations[playerno] += 10;
			}
			io.sockets.emit('locations', locations);
		});
	});

});
