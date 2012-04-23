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


//lenX and lenY cannot be 0.
function Wall(square, lenX, lenY) {
	this.x = square.x;
	this.y = square.y;
	this.lenX = lenX;
	this.lenY = lenY;
}

var nextItemId = 1;

function Item(square, type){
    this.x = square.x;
    this.y = square.y;
    this.type = type;
    this.itemId = nextItemId;
    nextItemId++;
    this.timeRemaining = -1;
}

// The Player object constructor
function Player(name, color, game){
    Bond.spy('playerInstantiated', {name: name});

    // state variables

    this.name = name;
    this.color = color;
    this.controllerID;

    this.segments = [];     // list of segments (squares), the first is the head of the snake and the last is the tail
    this.length = 2;        // the length of the snake (sometimes the actual size lags behind this length
    this.headProgress = 0;      // fraction of the head square that is filled so far
    this.speed = game.defaultSpeed;
    this.growing = false;       // whether or not the snake is actively growing at the moment
    this.dead = false;
    this.direction = "none";    // a string, either "left", "right", "up", or "down"
    this.nextDirection = "none";// direction to turn next time step. domain same as direction, but can also be "none"
    this.secondNextDirection = "none";  // similar to nextDirection, but allows the game to remember 2 pending turns

    this.score = 0;             // a positive or negative integer. increases by eating, decreases by dying

    //items
    this.inventory = [];
    this.inventoryModified = false;
    this.invincibilityTimeRemaining = 0;

    this.reset = function(){
        this.dead = false;
        this.length = 2;
        this.segments = [];
        this.segments.push(game.randomEmptySquare(5));
        this.direction = randomDirection();
        this.nextDirection = this.secondNextDirection = "none";
        this.inventory = [];
        this.inventoryModified = true;
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

    this.acquireItem = function(item){
        item.timeRemaining = -1;
        item.x = -1;
        item.y = -1;
        this.inventory.push(item);
        this.inventoryModified = true;
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
    this.defaultSpeed = .2;        // in terms of squares per time step

    // state variables

    this.availableColors = ["#FF0000", "#AAAAAA", "#0000FF", "#FFFF00", "#00FFFF", "#FF00FF"];
    this.started = false;
    this.starting = false;
    this.paused = false;
    this.players = [];
    this.items = [];
    this.walls = []; //most recent coordinate is last entry

    // items
    this.itemProbability = 1.0/250;
    this.itemTimeLimit = 500;
    this.numberOfItems = 6;
    this.invincibilityTime = 250;
    this.superFoodScoreValue = 5;
    this.speedChangeFactor = 1.5;
    this.sizeChangeInterval = 5;

    // game lifecycle methods

    this.start = function(){
        var game = this;
        this.refillFood();
        this.createWall();
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
            this.manageItems();
		}
    };

	// logic for moving the players around. for each player, turn if necessary, move forward, and detect collisions
    // then refill food
    this.updatePlayerPositions = function(){
		var i, player;
		for (i = 0; i < this.players.length; i++) {
			player = this.players[i];
            player.inventoryModified = false;
            player.headProgress += player.speed;
            if(player.headProgress >= 1){
                player.headProgress = 0;
                if(player.nextDirection != "none"){
                    player.direction = player.nextDirection;
                    player.nextDirection = player.secondNextDirection;
                    player.secondNextDirection = "none";
                }
                var head = player.segments[0];
                var newSquare = new Square(head.x, head.y);
                if (player.direction == "right") {
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
            this.collideWithItems(player);
            this.collideWithPlayers(player);
            this.collideWithWalls(player);
		}
        // penalize and reset the dead players
        var anyDead = false;
        for (i = 0; i < this.players.length; i++) {
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

    this.collideWithItems = function(player) {
        var i;
        var head = player.segments[0];
        for (i = 0; i < this.items.length; i++) {
            var item = this.items[i];
            if (item.x == head.x && item.y == head.y) {
                if(item.type == "food") {
                    player.score += this.foodScoreValue;    //increase score for eating a food
                    player.length += this.foodGrowthValue;  // increase size for eating a food
                    player.growing = true;
                } else if (item.type == "superfood"){
                    this.useItem(player, item);
                }else {
                    player.acquireItem(item);
                }
                this.items.splice(i,1);
            }
        }
    };
    
    this.collideWithWalls = function(player){
    	var head = player.segments[0];
    	for (i = 0; i < this.walls.length; i++) {
    		var wall = this.walls[i];
    		if ((head.x >= wall.x) && (head.x <= (wall.x + wall.lenX - 1)) 
    		&& (head.y >= wall.y) && (head.y <= (wall.y + wall.lenY - 1))) {
    			player.dead = true;
    		}	
    	}
    };

    this.collideWithPlayers = function(player){
        var i, j;
        var head = player.segments[0];
        for (i = 0; i < this.players.length; i++) {
            var other = this.players[i];
            for (j = 0; j < other.segments.length; j++){
                if(head.x == other.segments[j].x && head.y == other.segments[j].y){
                    if(player.invincibilityTimeRemaining > 0){
                        if(other != player && other.invincibilityTimeRemaining <= 0){
                            other.dead = true;
                        }
                    }else{
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
        }
    };

    // logic for placing and managing items

    this.manageItems = function(){
        var i;
        // decrement the time items have remaining
        for (i = 0; i < this.items.length; i++){
            if(this.items[i].timeRemaining > 0){
                this.items[i].timeRemaining--;
            }
        }
        // remove expired items
        for (i = 0; i < this.items.length; i++){
            if(this.items[i].timeRemaining == 0){
                this.items.splice(i, 1);
            }
        }
        // decrement the time invincibility lasts
        for (i = 0; i < this.players.length; i++) {
            if(this.players[i].invincibilityTimeRemaining > 0){
                this.players[i].invincibilityTimeRemaining--;
            }
        }
        // randomly place items
        var itemProbability = (this.itemProbability / this.numberOfItems) * (.5 + this.players.length / 2);
        if(Math.random() < itemProbability)
            this.placeRandom("invincibility");
        if(Math.random() < itemProbability)
            this.placeRandom("superfood");
        if(Math.random() < itemProbability)
            this.placeRandom("speedup");
        if(Math.random() < itemProbability)
            this.placeRandom("slowdown");
        if(Math.random() < itemProbability)
            this.placeRandom("grow");
        if(Math.random() < itemProbability)
            this.placeRandom("shrink");
    };

    this.useItem = function(player, item){
        if(item.type == "invincibility") {
            player.invincibilityTimeRemaining = this.invincibilityTime;
        } else if(item.type == "superfood"){
            player.score += this.superFoodScoreValue;
        } else if(item.type == "speedup"){
            player.speed *= this.speedChangeFactor;
        } else if(item.type == "slowdown"){
            player.speed /= this.speedChangeFactor;
        } else if(item.type == "grow"){
            player.length += this.sizeChangeInterval;
            player.growing = true;
        } else if(item.type == "shrink"){
            player.length -= this.sizeChangeInterval;
            if(player.length < 2)
                player.length = 2;
            while(player.segments.length > player.length)
                player.segments.splice(player.segments.length - 1, 1);
        }
        player.inventory.removeItem(item);
        player.inventoryModified = true;
    };

    this.dropItem = function(player, item){
        player.inventory.removeItem(item);
        player.inventoryModified = true;
    };

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
        var item = new Item(this.randomEmptySquare(0), type);
        if(item.type != "food"){
            item.timeRemaining = this.itemTimeLimit;
        }
        this.items.push(item);
    };
    
    this.createWall = function(){
    	this.walls = [];
  		this.walls.push(new Wall(new Square(13,5), 5, 20));
  		this.walls.push(new Wall(new Square(26,15), 5, 20));
  		this.walls.push(new Wall(new Square(39,25), 5, 20));  		
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

    this.randomEmptySquare = function(buffer){
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
            for (i = 0; i < this.walls.length; i++) {
            	var wall = this.walls[i];
            	if ((point.x >= (wall.x - buffer)) && (point.x <= (wall.x + wall.lenX - 1 + buffer*2)) 
	    		&& (point.y >= (wall.y - buffer)) && (point.y <= (wall.y + wall.lenY - 1 + buffer*2))) {
	    			taken = true;
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

Array.prototype.removeItem = function(element){
    var toRemove = -1;
    for(var i=0; i<this.length; i++){
        if(this[i].itemId == element.itemId){
            toRemove = i;
            break;
        }
    }
    if(toRemove >= 0){
        this.splice(toRemove, 1);
    }
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

function getItemColor(type){
    if(type == "food"){
        return "#FFFFFF";
    }else if(type == "superfood"){
        return "#FF6699";
    }else if(type == "speedup"){
        return "#339900";
    }else if(type == "slowdown"){
        return "#CC0000";
    }else if(type == "grow"){
        return "#0000CC";
    }else if(type == "shrink"){
        return "#FFFF33";
    }else if(type == "invincibility"){
        return "#FF9900";
    }else {
        return "#000000";
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
    exports.getItemColor = getItemColor;
}
