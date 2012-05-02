var socket;
var game;
var players = {};
var h = 0;
var w = 0;
var disabled;
var dealerPlaying;

document.addEventListener("DOMContentLoaded", function(){
    // create the game and initialize things based on it
    game = createGame();
    var table = document.getElementById('table');
    w = table.offsetWidth;
    h = table.offsetHeight;

    // start the socket.io connection and set up the handlers
    socket = io.connect('http://' + window.location.host);
    // the display's own connection handshake
    socket.on('connect', function(){
        if(!disabled){
            document.getElementById("message").innerHTML = 'Display connected to server.<br>' + game.numDecks + ' decks, dealer stands on soft 17';
            socket.emit('newDisplay', {title: game.title});
        }
    });
    // a new controller has connected through the server, create a player for it
    socket.on('newPlayer', function(data){
        if(!game.allPlayersHaveBet()){
            var player = game.newPlayer(data.name);
            if(player){
                player.controllerID = data.controllerID;
                players[data.controllerID] = player;
                socket.emit('playerConnected', {controllerID: data.controllerID, title: game.title});
                redraw();
            }else{
                socket.emit('playerConnected', {controllerID: data.controllerID, error: "too many players"});
            }
        }else{
            socket.emit('playerConnected', {controllerID: data.controllerID, error: "game already started. please try again later"});
        }
    });
    // a client has disconnected from the server
    socket.on('clientDisconnect', function(data){
        if(game.players.indexOf(players[data.controllerID]) >= 0){
            game.removePlayer(players[data.controllerID]);
            redraw();
        }
    });
    socket.on('disconnect', function(){
        document.getElementById("message").innerHTML = 'Display disconnected from server';
        document.getElementById("flash").innerHTML = "GAME OVER";
        disabled = true;
    });
    // input from a controller through the server
    socket.on('bet', function(data){
        // ignore it if the message is from a controllerID that doesn't correspond to one of our players
        var player = players[data.controllerID];
        if(player){
            player.bet(data.amount);
            if(game.allPlayersHaveBet()){
                game.deal();
                var i, len = game.players.length;
                for(i = 0; i < len; i++){
                    var pl = game.players[i];
                    var hand = pl.hand;
                    socket.emit('cards', {controllerID: pl.controllerID, cards: hand, total: game.handValue(hand)});
                }
                document.getElementById("flash").innerHTML = "Hit or Stand!";
                socket.emit('startHitting');
                redraw();
            }
            redraw();
        }
    });
    socket.on('hit', function(data){
        // ignore it if the message is from a controllerID that doesn't correspond to one of our players
        var player = players[data.controllerID];
        if(player){
            players[data.controllerID].hit();
            var hand = player.hand;
            socket.emit('cards', {controllerID: player.controllerID, cards: hand, total: game.handValue(hand)});
            if(game.allPlayersDoneHitting()){
                finish();
            }
            redraw();
        }
    });
    socket.on('stand', function(data){
        // ignore it if the message is from a controllerID that doesn't correspond to one of our players
        var player = players[data.controllerID];
        if(player){
            players[data.controllerID].stand();
            if(game.allPlayersDoneHitting()){
                finish();
            }
            redraw();
        }
    });
    // set up the Bond debugger
    Bond.startRemoteClient(socket);
}, false);

function finish(){
    document.getElementById("flash").innerHTML = "Dealer is playing";
    dealerPlay(function(){
        dealerPlaying = true;
        document.getElementById("flash").innerHTML = "Hand complete";
        redraw();
        setTimeout(function(){
            dealerPlaying = false;
            game.payout();
            redraw();
            socket.emit('startBetting');
            document.getElementById("flash").innerHTML = "Place your bets!";
        }, 4000);
    });
}

function dealerPlay(callback){
    if(game.handValue(game.dealerHand) < 17){
        setTimeout(function(){
            game.dealerHand.push(game.drawCard());
            redraw();
            dealerPlay(callback);
        }, 2000);
    }else{
        callback();
    }
}

function redraw(){
    document.getElementById('table').innerHTML = '';
    drawPlayer(w/2 - 50, 100, 0, "", -1, -1, game.dealerHand);
    var i, x, y, radius = 5*h/6, rot, player, len=game.players.length;
    for(i=0; i<len; i++){
        player = game.players[i];
        rot = -((i+.5)/len)*Math.PI/2 + Math.PI/4;
        x = -radius*Math.sin(rot);
        y = radius*Math.cos(rot);
        drawPlayer(x + w/2 - 50, y + h/3 - 200, rot, player.name, player.chips, player.currentBet, player.hand);
    }
}

function drawPlayer(x, y, rotation, name, chips, bet, hand){
    var div = document.createElement('div');
    div.setAttribute('class', 'player');
    var value = game.handValue(hand);
    if(value > 21){
        value = "BUST";
    }else if(value == 21){
        if(hand.length == 2){
            value = "blackjack!";
        }else{
            value = "21!";
        }
    }
    if(bet == -1){
        div.innerHTML = 'Dealer<br>';
    }else{
        div.innerHTML = name + '<br>$' + chips + '<br>' + 'Bet: $' + bet + '<br>';
    }
    if(value != 0 && (bet != -1 || dealerPlaying)){
        div.innerHTML += value;
    }
    div.style[getTransformProperty(div)] = 'translate(' + x + ', ' + y + ') ' + 'rotate(' + rotation + 'rad)';
    var cards = document.createElement('div');
    cards.setAttribute('class', 'cards');
    var i, card, theCard;
    for(i=0; i<hand.length; i++){
        card = document.createElement('div');
        card.setAttribute('class', 'card');
        card.style.top = 5 * i;
        card.style.left = 10 * i;
        if(i==0 && bet == -1){
            card.setAttribute('id', 'down');
        }else{
            theCard = hand[i];
            card.innerHTML = theCard.number + '<br>' + suitToSymbol(theCard.suit);
            if(theCard.suit == 'hearts' || theCard.suit == 'diamonds'){
                card.style.color = 'red';
            }
        }
        cards.appendChild(card);
    }
    div.appendChild(cards);
    document.getElementById('table').appendChild(div);
}

function suitToSymbol(suit){
    switch(suit){
        case 'hearts':
            return '&#9829;';
            break;
        case 'diamonds':
            return '&#9830;';
            break;
        case 'clubs':
            return '&#9827;';
            break;
        case 'spades':
            return '&#9824;';
            break;
        default:
            return '';
    }
}

// helper function, credit to
// http://www.zachstronaut.com/posts/2009/02/17/animate-css-transforms-firefox-webkit.html
function getTransformProperty(element) {
    // Note that in some versions of IE9 it is critical that
    // msTransform appear in this list before MozTransform
    var properties = [
        'transform',
        'webkitTransform',
        'msTransform',
        'MozTransform',
        'OTransform'
    ];
    var p;
    while (p = properties.shift()) {
        if (typeof element.style[p] != 'undefined') {
            return p;
        }
    }
    return false;
}