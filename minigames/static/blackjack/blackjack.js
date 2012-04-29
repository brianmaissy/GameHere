if (typeof window === 'undefined'){
    /*BOND*/ Bond = require("../bond").Bond;
}

function Card(number, suit){
    this.number = number;
    this.suit = suit;
}

// The Player object constructor
function Player(name, game){

    // state variables
    this.name = name;
    this.chips = game.initialChips;
    this.hand = [];
    this.bet = 0;

    this.bet = function(amount){
        if(amount <= this.chips){
            this.bet = amount;
        }else{
            this.bet = this.chips;
        }
    };
    this.hit = function(){
        this.hand.push(game.drawCard());
    };
    this.stand = function(){

    };
}

// The Blackjack game constructor. A simple implementation of infinite-deck blackjack
function Blackjack(){

    // constants

    this.title = 'Blackjack';
    this.initialChips = 500;
    this.numbers = ['A', 2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K'];
    this.suits = ['hearts', 'clubs', 'diamonds', 'spades'];

    // state variables

    this.deck = [];
    this.players = [];
    this.phase = "betting";

    // game lifecycle methods

    this.deal = function(){
        this.initDeck();
        var i, len = this.players.length;
        for(i = 0; i < len; i++){
            players[i].hand.push(this.drawCard());
            players[i].hand.push(this.drawCard());
        }
    };

    // functions for dealing with cards

    this.initDeck = function(){
        this.deck = [];
        var i, j, suits = this.suits, numbers = this.numbers;
        var numSuits = suits.length, numNumbers = numbers.length;
        for(i=0; i<numSuits; i++){
            var suit = suits[i];
            for(j=0; j<numNumbers; j++){
                var number = numbers[j];
                this.deck.push(new Card(number, suit));
            }
        }
    };

    this.drawCard = function(){
        return this.deck.splice(Math.floor(Math.random() * this.deck.length), 1);
    };

    this.handValue = function(hand){
        var i, len = hand.length, val = 0, numAces = 0;
        for(i = 0; i < len; i++){
            var card = hand[i];
            val += this.cardValue(card);
            if(card.number == "A") numAces++;
        }
        while(val > 21 && numAces > 0){
            val -= 10;
            numAces--;
        }
        return val;
    }

    // returns the value of a card
    this.cardValue = function(card){
        var num = card.number;
        if(num >= 2 && num <= 10){
            return num;
        }else if(num == "A"){
            return 11;
        }else{
            return 10;
        }
    };

    // logic for managing the players

    // when a player joins, add him to the end of the players array
    this.newPlayer = function(name){
        if(this.players.length >= 6){
            return false;
        }
        // create the Player object
        var player = new Player(name, this);
        this.players.push(player);
        // return the Player object, so the server can associate it with a socket
        return player;
    };

    // when a player leaves, remove them from the list and release their color
    this.removePlayer = function(player) {
        // remove the player from the players array
        this.players.splice(this.players.indexOf(player), 1);
    };

    this.allPlayersHaveBet = function(){
        var i, len = this.players.length;
        for(i=0; i<len; i++){
            if(this.players[i].bet == 0) return false;
        }
        return true;
    }

}

// return a single instance of a Multipong object
function createGame(){
    return new Blackjack();
}

if (typeof window === 'undefined'){
    exports.Blackjack = Blackjack;
    exports.Player = Player;
    exports.createGame = createGame;
}
