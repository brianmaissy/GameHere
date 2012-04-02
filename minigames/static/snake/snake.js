if (typeof window === 'undefined'){
    Bond = require("../bond").Bond;
}

// The Square object, represents a square on the field
// The x and y coordinates are on [0, fieldWidth-1] and [0, fieldHeight -1], respectively
// The origin is in the top left
function Square(x, y){
    this.x = x;
    this.y = y;
}

// The Player object constructor
function Player(name, color, game){
    Bond.spy('playerInstantiated', {name: name});

    // state variables

    this.name = name;
    this.controlSquares = [];    // list of squares, the first is the tail of the snake and the last is the head
    this.headProgress = 0.0;    // a float which represents the percentage of its current square the head has filled
    this.direction = "";                    // a string, either "left", "right", "up", or "down"
    this.nextDirection = this.direction;    // the direction to go when the current head square is full
    this.color = color;
    this.score = 0;                         // a positive or negative integer. increases by eating, decreases by dying
	this.test = "right"
    // give it an initial control point
    this.controlSquares.push(game.randomPoint());

    // motion function based on an input of 1 or -1 in x or y
    this.move = function(motion){
	     //implement motion. basically just set nextDirection
		if (motion.x == -1 && motion.y == 0)
		{
			this.nextDirection = "left";
		} else if (motion.x == 1 && motion.y == 0) {
			this.nextDirection = "right";
		} else if (motion.x == 0 && motion.y == 1) {
			this.nextDirection = "down"
		} else {
			this.nextDirection = "up"
		}
    };
}

// The Snake game constructor
function Snake(){

    // constants

    this.title = 'Snake';
    this.fieldWidth = 50;  // the field is an array of discrete squares
    this.fieldHeight = 50;
    this.speed = .01;       // in terms of squares per time step
    this.foodValue = 1;
    this.deathValue = -5;

    // state variables

    this.availableColors = ["#FF0000", "#FFFFFF", "#0000FF", "#FFFF00", "#00FFFF", "#FF00FF"];
    this.started = false;
    this.starting = false;
    this.paused = false;
    this.players = [];
    this.food = [];

    // game lifecycle methods

    this.start = function(){
        var game = this;
		var i;
		for (i = 0; i < game.players.length ; i++)
		{
			game.players[i].direction = "right";
			game.players[i].nextDirection = game.players[i].direction;
		}
        // TODO: initialize the players' positions, directions, etc
        Bond.spy('gameStart', {started: true, placedFood: true});
        // wait around for 2 seconds and then start the game
        game.starting = true;
        setTimeout(function(){
            if(game.starting){
                game.started = true;
                game.starting = false;
                game.placeRandomFood();
            }
        }, 2000);
    };

    this.pause = function(){
        this.paused = !this.paused;
    };

    this.stop = function(){
        this.started = false;
        this.starting = false;
    };

    this.restart = function(){
        this.stop();
        this.start();
    };

    // the tick function is called by the server every so often to tell it that time is moving. This design
    // was intentional, to decouple the game logic from the server logic, and time seems like a server thing
    this.tick = function(){
        if(this.started && !this.paused)
		{
			this.updatePlayerPositions();
		} 
    };

    // logic for moving the players around

    this.updatePlayerPositions = function(){
		var i;
		for (i = 0; i < this.players.length; i++) 
		{
			var player = this.players[i];
			//console.log("nextDirection:",player.nextDirection);
			var positionX = player.controlSquares.last().x;
			var positionY = player.controlSquares.last().y;
			if (player.nextDirection == "right")
			{
				if (positionX >= 49)
				{	
					console.log("right boundary check");
					positionX = 0;					
				} else {
					positionX += 1;
				}
			} else if (player.nextDirection == "left") {
				if (positionX <= 0)
				{
					positionX = 49;					
				} else {
					positionX -= 1;
				}
			} else if (player.nextDirection == "up") {
				if (positionY <= 0)
				{
					positionY = 49;
				} else {
					positionY -= 1;
				}
			} else if (player.nextDirection == "down") {
				if (positionY >= 49)
				{
					positionY = 0;
				} else {		
					positionY += 1;
				}
			} else {
				console.log("nextDirection is not being set");
			}
			player.controlSquares.last().x = positionX;
			player.controlSquares.last().y = positionY;
			player.direction = player.nextDirection;
//			player.nextDirection = "";
//			console.log("new:",player.controlSquares);
		}	
		
        // TODO: for each player, turn if necessary, move him forward, detect collisions, and kill anyone if they collided into someone else
    };

    this.placeRandomFood = function(){
        this.food.push(this.randomPoint());
    };

    // logic for managing the players

    // when a player joins, add him to the end of the players array
    this.newPlayer = function(name){
        if(this.availableColors.length == 0){
            return false;
        }
        // choose a random available color to assign to the player
        var index = Math.floor(Math.random() * this.availableColors.length);
        var color = this.availableColors[index];
        this.availableColors.splice(index, 1);
        // create the Player object
        var player = new Player(name, color, this);
        this.players.push(player);
        // start the game if it isn't started yet and we have two or more players
        if (!this.started && !this.starting && this.players.length >= 2){
            this.start();
        }
        // return the Player object, so the server can associate it with a socket
        return player;
    };

    // when a player leaves, remove them from the list and release their color
    this.removePlayer = function(player) {
        // release the color so it can be used again later
        this.availableColors.push(player.color);
        // remove the player from the players array
        this.players.splice(this.players.indexOf(player), 1);
        // stop the game if it is in progress and we have less than two players
        if ((this.started || this.starting) && this.players.length < 2) {
            this.stop();
        }
    };

    // utility functions

    this.randomPoint = function(){
        return new Square(Math.floor(Math.random()*this.fieldWidth), Math.floor(Math.random()*this.fieldHeight));
    };
}

// utility functions

Array.prototype.last = function(){
    return this[this.length-1];
};

// return a single instance of a Multipong object
function createGame(){
    return new Snake();
}

if (typeof window === 'undefined'){
    exports.Snake = Snake;
    exports.Player = Player;
    exports.createGame = createGame;
}
