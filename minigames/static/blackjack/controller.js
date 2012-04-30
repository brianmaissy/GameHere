var socket;
var name;
var connected = false;

document.addEventListener("DOMContentLoaded", function(){
    name = prompt("What is your name?", "anonymous");

    // start the socket.io connection and set up the handlers
    socket = io.connect('http://' + window.location.host);
    socket.on('connect', function(){
        document.getElementById('message').innerHTML = 'Controller connected to server';
        socket.emit('newPlayer', {title: 'Blackjack', name: name});
    });
    socket.on('playerConnected', function(data){
        if(data.error){
            document.getElementById('message').innerHTML =  'Error: ' + data.error;
            socket.disconnect();
        }else{
            connected = true;
            document.getElementById('message').innerHTML =  data.title + ' controller connected to display as player ' + name;
            document.getElementById('bet').style.display = 'block';
        }
    });
    socket.on('startBetting', function(){
        if(connected){
            document.getElementById('wait').style.display = 'none';
            document.getElementById('hit').style.display = 'none';
            document.getElementById('bet').style.display = 'block';
            document.getElementById('hand').style.opacity = .5;
            document.getElementById('value').style.opacity = .5;
        }
    });
    socket.on('startHitting', function(){
        if(connected){
            document.getElementById('wait').style.display = 'none';
            document.getElementById('bet').style.display = 'none';
            document.getElementById('hit').style.display = 'block';
            document.getElementById('hand').style.opacity = 1;
            document.getElementById('value').style.opacity = 1;
        }
    });
    socket.on('cards', function(data){
        document.getElementById('hand').innerHTML = "";
        var i, newCard, cards = data.cards;
        for(i=0; i<cards.length; i++){
            var card = cards[i];
            newCard = document.createElement('div');
            newCard.setAttribute('class', 'card');
            if(card.suit == 'hearts' || card.suit == 'diamonds'){
                newCard.style.color = 'red';
            }
            newCard.innerHTML = card.number + '<br>' + suitToSymbol(card.suit);
            document.getElementById('hand').appendChild(newCard);
            var total = data.total;
            if(total > 21){
                total = "BUST";
                document.getElementById("hit").style.display = "none";
                document.getElementById("wait").style.display = "block";
            }else if(total == 21){
                if(cards.length == 2){
                    total = "blackjack!";
                }else{
                    total = "21!";
                }
                setTimeout(stand, 25);
            }
        }
        document.getElementById('total').innerHTML = total;
    });
}, false);

function bet(bet){
    document.getElementById("bet").style.display = "none";
    document.getElementById("wait").style.display = "block";
    socket.emit("bet", {amount: bet});
}

function hit(){
    socket.emit("hit");
}

function stand(){
    document.getElementById("hit").style.display = "none";
    document.getElementById("wait").style.display = "block";
    socket.emit("stand");
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