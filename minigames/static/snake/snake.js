if (typeof window === 'undefined'){
    Bond = require("../bond").Bond;
}

// The Square object, represents a square on the field
// The x and y coordinates are on [0, fieldWidth-1] and [0, fieldHeight -1], respectively
// The origin is in the top left
function Square(x, y){
    this.x = x;
    this.y = y;
    this.direction = "none";
}

function Item(square, type){
    this.x = square.x;
    this.y = square.y;
    this.type = type;
}

// The Player object constructor
function Player(name, color, game){
    Bond.spy('playerInstantiated', {name: name});

    // state variables

    this.name = name;
    this.segments = [];     // list of segments (squares), the first is the head of the snake and the last is the tail
    this.length = 2;        // the length of the snake (sometimes the actual size lags behind this length
    this.headProgress = 0;      // fraction of the head square that is filled so far
    this.growing = false;       // whether or not the snake is actively growing at the moment
    this.dead = false;
    this.direction = "none";    // a string, either "left", "right", "up", or "down"
    this.nextDirection = "none";// direction to turn next time step. domain same as direction, but can also be "none"
    this.secondNextDirection = "none";  // similar to nextDirection, but allows the game to remember 2 pending turns
    this.color = color;
    this.score = 0;             // a positive or negative integer. increases by eating, decreases by dying

    this.reset = function(){
        this.dead = false;
        this.length = 2;
        this.segments = [];
        this.segments.push(game.randomEmptySquare());
        this.direction = randomDirection();
        this.nextDirection = this.secondNextDirection = "none";
    };
    this.reset();

    // motion function based on an input of 1 or -1 in x or y
    this.move = function(motion){
        if(this.nextDirection == "none"){
            if (motion.x == -1 && motion.y == 0 && this.direction != "right") {
                this.nextDirection = "left";
            } else if (motion.x == 1 && motion.y == 0 && this.direction != "left") {
                this.nextDirection = "right";
            } else if (motion.x == 0 && motion.y == 1 && this.direction != "up") {
                this.nextDirection = "down";
            } else if (motion.x == 0 && motion.y == -1 && this.direction != "down"){
                this.nextDirection = "up";
            }else{
                this.nextDirection = "none";
            }
        }else{
            if(this.secondNextDirection == "none"){
                if (motion.x == -1 && motion.y == 0 && this.nextDirection != "right") {
                    this.secondNextDirection = "left";
                } else if (motion.x == 1 && motion.y == 0 && this.nextDirection != "left") {
                    this.secondNextDirection = "right";
                } else if (motion.x == 0 && motion.y == 1 && this.nextDirection != "up") {
                    this.secondNextDirection = "down";
                } else if (motion.x == 0 && motion.y == -1 && this.nextDirection != "down"){
                    this.secondNextDirection = "up";
                }else{
                    this.secondNextDirection = "none";
                }
            }
        }
    };
}

// The Snake game constructor
function Snake(){

    // constants

    this.title = 'Snake';
    this.fieldWidth = 50;   // the field is an array of discrete squares
    this.fieldHeight = 50;
    this.foodScoreValue = 1;
    this.foodGrowthValue = 1;
    this.deathScoreValue = -5;
    this.speed = .2;        // in terms of squares per time step
    this.foodLimit = 2;

    // state variables

    this.availableColors = ["#FF0000", "#FFFFFF", "#0000FF", "#FFFF00", "#00FFFF", "#FF00FF"];
    this.started = false;
    this.starting = false;
    this.paused = false;
    this.players = [];
    this.items = [];

    // game lifecycle methods

    this.start = function(){
        var game = this;
        this.refillFood();
        Bond.spy('gameStart', {started: true});
        // wait around for 2 seconds and then start the game
        game.starting = true;
        setTimeout(function(){
            if(game.starting){
                game.started = true;
                game.starting = false;
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

	// logic for moving the players around. for each player, turn if necessary, move forward, and detect collisions
    // then refill food
    this.updatePlayerPositions = function(){
		var i, player;
		for (i = 0; i < this.players.length; i++)
		{
			player = this.players[i];
            player.headProgress += this.speed;
            if(player.headProgress >= 1){
                player.headProgress = 0;
                if(player.nextDirection != "none"){
                    player.direction = player.nextDirection;
                    player.nextDirection = player.secondNextDirection;
                    player.secondNextDirection = "none";
                }
                var head = player.segments[0];
                var newSquare = new Square(head.x, head.y);
                if (player.direction == "right")
                {
                    if (head.x >= this.fieldWidth - 1){
                        newSquare.x = 0;
                    } else {
                        newSquare.x += 1;
                    }
                } else if (player.direction == "left") {
                    if (head.x <= 0){
                        newSquare.x = this.fieldWidth - 1;
                    } else {
                        newSquare.x -= 1;
                    }
                } else if (player.direction == "up") {
                    if (head.y <= 0){
                        newSquare.y = this.fieldHeight - 1;
                    } else {
                        newSquare.y -= 1;
                    }
                } else if (player.direction == "down") {
                    if (head.y >= this.fieldHeight - 1){
                        newSquare.y = 0;
                    } else {
                        newSquare.y += 1;
                    }
                }
                player.segments[0].direction = player.direction;
                newSquare.direction = player.direction;
                player.segments.unshift(newSquare);
                if(player.segments.length > player.length){
                    player.segments.splice(player.segments.length - 1, 1);
                    player.growing = false;
                }
            }
            this.collideWithFood(player);
            this.collideWithPlayers(player);
		}
        // penalize and reset the dead players
        var anyDead = false;
        for (i = 0; i < this.players.length; i++)
        {
            player = this.players[i];
            if(player.dead){
                player.score += this.deathScoreValue;
                player.reset();
                anyDead = true;
            }
        }
        if(anyDead){
            this.restart();
        }
        this.refillFood();
    };

    this.collideWithFood = function(player) {
        var i;
        var head = player.segments[0];
        for (i = 0; i < this.items.length; i++) {
            var item = this.items[i];
            if (item.type == "food" && item.x == head.x && item.y == head.y)
            {
                player.score += this.foodScoreValue;         //increase score for eating a food
                player.length += this.foodGrowthValue;  // increase size for eating a food
                player.growing = true;
                this.items.splice(i,1);
            }
        }
    };

    this.collideWithPlayers = function(player){
        var i, j;
        var head = player.segments[0];
        for (i = 0; i < this.players.length; i++)
        {
            var other = this.players[i];
            for (j = 0; j < other.segments.length; j++){
                if(head.x == other.segments[j].x && head.y == other.segments[j].y){
                    // don't collide with your own head
                    if(!(other == player && j == 0)){
                        // don't collide with a tail that isn't there
                        if(!(j == other.segments.length - 1 && player.direction == other.direction && player.headProgress > other.headProgress)){
                            player.dead = true;
                        }
                    }
                    // kill the other guy too if we hit head on
                    if(j == 0 && opposite(player.direction) == other.direction){
                        other.dead = true;
                    }
                }
            }
        }
    };

    // logic for placing items

    this.refillFood = function(){
        var foodCount = 0;
        var foodLimit = Math.floor(this.players.length / 2) + 1;
        for(var i = 0; i < this.items.length; i++){
            if(this.items[i].type == "food"){
                foodCount++;
            }
        }
        while (foodCount < foodLimit){
            this.placeRandom("food");
            foodCount++;
        }
    };

    this.placeRandom = function(type){
        this.items.push(new Item(this.randomEmptySquare(), type));
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
        if (!this.started && !this.starting && this.players.length >= 1){
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
        if ((this.started || this.starting) && this.players.length < 1) {
            this.stop();
        }
    };

    // utility functions

    this.randomEmptySquare = function(){
        var taken = true;
        var point;
        var i, j;
        while(taken){
            point = this.randomPoint();
            taken = false;
            for (i = 0; i < this.items.length; i++) {
                if (this.items[i].x == point.x && this.items[i].y == point.y)
                    taken = true;
            }
            for (i = 0; i < this.players.length; i++) {
                for (j = 0; j < this.players[i].segments.length; j++){
                    if(point.x == this.players[i].segments[j].x && point.y == this.players[i].segments[j].y){
                        taken = true;
                    }
                }
            }
        }
        return point;
    };

    this.randomPoint = function(){
        return new Square(Math.floor(Math.random()*this.fieldWidth), Math.floor(Math.random()*this.fieldHeight));
    };
}

// utility functions

Array.prototype.last = function(){
    return this[this.length-1];
};

function randomDirection(){
    var directions = ["left", "right", "up", "down"];
    return directions[Math.floor(Math.random()*directions.length)];
}

function opposite(dir){
    if(dir == "left"){
        return "right";
    }else if(dir == "right"){
        return "left";
    }else if(dir == "up"){
        return "down";
    }else if(dir == "down"){
        return "up";
    }else{
        return false;
    }
}

// return a single instance of a Snake object
function createGame(){
    return new Snake();
}

if (typeof window === 'undefined'){
    exports.Snake = Snake;
    exports.Player = Player;
    exports.createGame = createGame;
    exports.opposite = opposite;
}
