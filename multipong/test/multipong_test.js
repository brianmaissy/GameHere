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
        test.ok(Bond.seen('gameStart', {started: true, speed_gt: 0}));
        test.ok(Bond.seen('gameStart', {started: true, speed_lt: 1}));
        test.ok(Bond.seen('gameStart', {started: true, speed_gte: .01}));
        test.ok(Bond.seen('gameStart', {started: true, speed_lte: .01}));
        game.start();
        test.equals(2, Bond.seenTimes('gameStart', {started: true}));
        test.done();
    },
    countPlayersCreated: function(test){
        test.expect(7);
        new multipong.Player('brian');
        test.ok(Bond.seen('playerInstantiated', {name: 'brian'}));
        test.ok(Bond.seen('playerInstantiated', {name_begins_with: 'br'}));
        test.ok(Bond.seen('playerInstantiated', {name_ends_with: 'n'}));
        test.ok(Bond.seen('playerInstantiated', {name_contains: 'ia'}));
        test.ok(Bond.seen('playerInstantiated', {name_neq: 'joe'}));
        test.ok(Bond.seen('playerInstantiated', {name_in: ['brian', 'george']}));
        game.newPlayer('george');
        test.equals(2, Bond.seenTimes('playerInstantiated', {}));
        test.done();
    }
};
