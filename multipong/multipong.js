// The Multipong game
var Multipong = exports;
Multipong.title = 'MultiPong';
Multipong.paddleWidth = .2;
Multipong.paddleThickness = .03;
Multipong.ballRadius = .02;
Multipong.moveDistance = .1;

// The player object
function Player(name){
    this.name = name;
    this.x = 0;
    this.y = 0;
    this.position = 0;
    this.move = function(motion){
        if((motion.y == -1 && this.y >= Multipong.moveDistance) || (motion.y == 1 && this.y <= 1 - Multipong.moveDistance - Multipong.paddleWidth)){
            this.y += Multipong.moveDistance * motion.y;
            this.y = Math.round(this.y*100)/100;
        }
    }
}

// utility function, temporary until users can choose their own names
function randomString() {
	var chars = "abcdefghiklmnopqrstuvwxyz";
	var string_length = 8;
	var randomstring = '';
	for (var i=0; i<string_length; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum,rnum+1);
	}
	return randomstring;
}

var started = false;
var leftPlayers = [];
var rightPlayers = [];
var leftScore = 0;
var rightScore = 0;
var ballLocationX = .5;
var ballLocationY = .5;
var ballSpeedX = 0;
var ballSpeedY = 0;

function start(){
    started = true;
    var ballSpeed = .005;
    var angle = Math.random() * Math.PI/2 + Math.PI/4;
    ballSpeedX = ballSpeed * Math.sin(angle);
    ballSpeedY = ballSpeed * Math.cos(angle);
    if(Math.random()<.5) ballSpeedX = -ballSpeedX;
}

function restart(){
    ballSpeedX = 0;
    ballSpeedY = 0;
    ballLocationX = .5;
    ballLocationY = .5;
    setTimeout(start, 2000);
}

Multipong.tick = function(){
    Multipong.updateBallPosition();
}

Multipong.updateBallPosition = function(){
    ballLocationX += ballSpeedX;
    ballLocationY += ballSpeedY;
    // check for hitting the walls
    if(ballLocationY > 1 - Multipong.ballRadius){
        ballSpeedY = -ballSpeedY;
    }
    if(ballLocationY < Multipong.ballRadius){
        ballSpeedY = -ballSpeedY;
    }
    if(ballLocationX < -Multipong.ballRadius){
        rightScore++;
        restart();
    }
    if(ballLocationX > 1 + Multipong.ballRadius){
        leftScore++;
        restart();
    }
    // check for hitting a paddle
    if(ballLocationX < .5 && ballSpeedX < 0){
        for(i=0; i < leftPlayers.length; i++){
            if(collision(leftPlayers[i], 1)){
                ballSpeedX = -ballSpeedX;
            }
        }
    }else if (ballLocationX > .5 && ballSpeedX > 0){
        for(i=0; i < rightPlayers.length; i++){
            if(collision(rightPlayers[i], -1)){
                ballSpeedX = -ballSpeedX;
            }
        }
    }
}

function collision(player, direction){
    var paddleTop = player.y;
    var paddleBottom = player.y + Multipong.paddleWidth;
    if(ballLocationY + Multipong.ballRadius > paddleTop && ballLocationY - Multipong.ballRadius < paddleBottom){
        var paddleFrontier = player.x + direction*Multipong.paddleThickness/4;
        var ballFrontier = ballLocationX - direction*Multipong.ballRadius;
        var difference = direction*(paddleFrontier - ballFrontier);
        if(difference > 0 && difference < Math.abs(ballSpeedX)){
            return true;
        }
    }
    return false;
}

// to add or remove players, we update the player arrays and the x values of all players
Multipong.newPlayer = function(){
    var player = new Player(randomString());
    if (leftPlayers.length > rightPlayers.length){
        player.position = rightPlayers.length + 1;
        rightPlayers.push(player);
        if(!started) start();
    }else{
        player.position = leftPlayers.length + 1;
        leftPlayers.push(player);
    }
    calculateXPositions();
    return player;
}
// when players leave, all players outside of them on their side move up
Multipong.removePlayer = function(player){
    var index = leftPlayers.indexOf(player);
    if (index >= 0){
        leftPlayers.splice(index, 1);
        for(i=0; i < leftPlayers.length; i++){
            leftPlayers[i].position = -i - 1;
        }
    }else{
        index = rightPlayers.indexOf(player);
        rightPlayers.splice(index, 1);
        for(i=0; i < rightPlayers.length; i++){
            rightPlayers[i].position = i + 1;
        }
    }
    calculateXPositions();
}

// calculates the x locations of all players based on their positions
function calculateXPositions(){
    for(i=0; i < leftPlayers.length; i++){
        leftPlayers[i].x = .25 * (leftPlayers.length - leftPlayers[i].position + 1) / (leftPlayers.length + 1);
    }
    for(i=0; i < rightPlayers.length; i++){
        rightPlayers[i].x = 1 - .25 * (rightPlayers.length - rightPlayers[i].position + 1) / (rightPlayers.length + 1);
    }
}

// returns the gamestate, for updating the clients
Multipong.state = function(){
    return {
        players: leftPlayers.concat(rightPlayers),
        ball: {x: ballLocationX, y: ballLocationY},
        score: {left: leftScore, right: rightScore}
    };
}
