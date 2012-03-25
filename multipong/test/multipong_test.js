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
        test.expect(6);
        game.start();
        test.ok(Bond.seen('gameStart', {started: true}));
        test.ok(Bond.seen('gameStart', {started: true, speed__gt: 0}));
        test.ok(Bond.seen('gameStart', {started: true, speed__lt: 1}));
        test.ok(Bond.seen('gameStart', {started: true, speed__gte: .0075}));
        test.ok(Bond.seen('gameStart', {started: true, speed__lte: .0075}));
        game.start();
        test.equals(Bond.seenTimes('gameStart', {started: true}), 2);
        test.done();
    },
    countPlayersCreated: function(test){
        test.expect(7);
        new multipong.Player('brian', '', game);
        test.ok(Bond.seen('playerInstantiated', {name: 'brian'}));
        test.ok(Bond.seen('playerInstantiated', {name__begins_with: 'br'}));
        test.ok(Bond.seen('playerInstantiated', {name__ends_with: 'n'}));
        test.ok(Bond.seen('playerInstantiated', {name__contains: 'ia'}));
        test.ok(Bond.seen('playerInstantiated', {name__neq: 'joe'}));
        test.ok(Bond.seen('playerInstantiated', {name__in: ['brian', 'george']}));
        game.newPlayer('george');
        test.equals(Bond.seenTimes('playerInstantiated', {}), 2);
        test.done();
    }
};
