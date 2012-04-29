var socket;
var name;
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
            document.getElementById('message').innerHTML =  data.title + ' controller connected to display as player ' + name;
        }
    });
    socket.on('startBetting', function(data){
        document.getElementById('wait').style.display = 'none';
        document.getElementById('bet').style.display = 'block';
    });
    socket.on('startHitting', function(data){
        document.getElementById('wait').style.display = 'none';
        document.getElementById('hit').style.display = 'block';
    });
    socket.on('card', function(data){
        var newCard = document.createElement('div');
        newCard.setAttribute('class', 'card');
        var card = data.card;
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
        }
        document.getElementById('total').innerHTML = total;
    });
}, false);

function bet(bet){
    socket.emit("bet", {amount: bet});
    document.getElementById("bet").style.display = "none";
    document.getElementById("wait").style.display = "block";
}

function hit(){
    socket.emit("hit");
}

function stand(){
    socket.emit("stand");
    document.getElementById("hit").style.display = "none";
    document.getElementById("wait").style.display = "block";
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
    }
}