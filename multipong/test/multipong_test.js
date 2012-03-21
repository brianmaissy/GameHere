var multipong = require("../static/multipong");
var game = multipong.createGame();
var Bond = require("../static/bond").Bond;

exports.testMultipong = {

    setUp: function (callback) {
        Bond.start();
        callback();
    },
    tearDown: function (callback) {
        // clean up
        callback();
    },
    countStarts: function(test){
        test.expect(2);
        game.start();
        test.ok(Bond.seen('gameStart', {started: true}));
        game.start();
        test.equals(2, Bond.seenTimes('gameStart', {started: true}));
        test.done();
    },
    countPlayersCreated: function(test){
        test.expect(2);
        var player = new multipong.Player('brian');
        test.ok(Bond.seen('playerInstantiated', {name: 'brian'}));
        game.newPlayer('george');
        test.equals(2, Bond.seenTimes('playerInstantiated', {}));
        test.done();
    }
};