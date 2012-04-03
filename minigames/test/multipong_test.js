var multipong = require("../static/multipong/multipong");
var game;
var Bond = require("../static/bond").Bond;
var pathToTraces = "../test/traces/";

exports.testMultipong = {
    setUp: function (callback) {
        Bond.start();
        game = multipong.createGame();
        game.startDelay = 0;
        callback();
    },
    tearDown: function (callback) {
        // clean up
        game.stop();
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
    testPlayersAdded: function(test){
        test.expect(11);
        new multipong.Player('brian', '', game);
        test.ok(Bond.seen('playerInstantiated', {name: 'brian'}));
        test.ok(Bond.seen('playerInstantiated', {name__begins_with: 'br'}));
        test.ok(Bond.seen('playerInstantiated', {name__ends_with: 'n'}));
        test.ok(Bond.seen('playerInstantiated', {name__contains: 'ia'}));
        test.ok(Bond.seen('playerInstantiated', {name__neq: 'joe'}));
        test.ok(Bond.seen('playerInstantiated', {name__in: ['brian', 'george']}));
        var lefty = game.newPlayer('george');
        game.newPlayer('right');
        var newLefty = game.newPlayer('secondOnLeft');
        test.ok(!game.availableColors.contains(lefty.color));
        test.equals(newLefty.position, 2);
        game.removePlayer(lefty);
        test.ok(game.availableColors.contains(lefty.color));
        test.equals(newLefty.position, 1);
        test.equals(Bond.seenTimes('playerInstantiated', {}), 4);
        test.done();
    },
    testGameStartsStopsAndPauses: function(test){
        test.expect(6);
        var lefty;
        game.onStart = function(){
            test.ok(game.started);
            var oldX = game.ballLocationX;
            game.tick();
            test.notEqual(oldX, game.ballLocationX);
            var oldY = lefty.y;
            lefty.move({y: 1});
            test.notEqual(oldY, lefty.y);
            game.pause();
            test.ok(game.paused);
            oldY = lefty.y;
            lefty.move({y: 1});
            test.equals(oldY, lefty.y);
            game.removePlayer(lefty);
            test.ok(!game.started);
            test.done();
        };
        // adding two players should start the game automatically
        lefty = game.newPlayer('a');
        game.newPlayer('b');
    },
    testBallBouncesStraight: function(test){
        test.expect(1);
        game.onStart = function(){
            game.ballDirection = 0;
            while(game.ballDirection == 0){
                game.tick();
            }
            test.equals(game.ballDirection, Math.PI);
            test.done();
        };
        // adding two players should start the game automatically
        game.newPlayer('a');
        game.newPlayer('b');
    },
    testScoring: function(test){
        test.expect(1);
        game.onStart = function(){
            game.ballDirection = Math.PI/6;
            while(game.ballDirection == Math.PI/6){
                game.tick();
            }
            test.equals(game.leftScore, 1);
            test.done();
        };
        // adding two players should start the game automatically
        game.newPlayer('a');
        game.newPlayer('b');
    },
    testNonPhysicalBounce: function(test){
        test.expect(2);
        var lefty, dir;
        game.onStart = function(){
            dir = game.ballDirection = Math.PI/10;
            while(game.ballDirection == dir){
                game.tick();
            }
            test.ok(Bond.seen("deflectTowardTangent"));
            for(var i=0; i<7; i++) lefty.move({y: 1});
            dir = game.ballDirection;
            var bounces = Bond.seenTimes("hitPaddle");
            while(Bond.seenTimes("hitPaddle") == bounces){          // !!! This is a unique power of Bond !!!
                game.tick();
            }
            test.ok(Bond.seen("deflectTowardNormal"));
            test.done();
        };
        // adding two players should start the game automatically
        lefty = game.newPlayer('a');
        game.newPlayer('b');
    },
    replicateBounce: function(test){
        test.expect(2);
        var dir;
        game.onStart = function(){
            dir = game.ballDirection = Math.PI/10;
            Bond.recordAt("deflectBall");           // !!! Another amazing use of Bond: recording execution state !!!
            while(game.ballDirection == dir){
                game.tick();
            }
            var observation = Bond.seen("deflectTowardTangent")[0];
            test.equals(Bond.seenTimes("deflectTowardTangent", {byAdding: observation.byAdding}), 1);
            Bond.replayAt("deflectBall");           // put it into replay mode...
            game.deflectBall(null, null);           // call a function with dummy arguments...
            test.equals(Bond.seenTimes("deflectTowardTangent", {byAdding: observation.byAdding}), 2); // and watch us get the same observation!
            test.done();
        };
        // adding two players should start the game automatically
        game.newPlayer('a');
        game.newPlayer('b');
    },
    replayTrace: function(test){                                // Use of manually recorded fixtures in regression tests
        Bond.spy("hello!");
        test.expect(1);
        Bond.readRecords(pathToTraces + 'deflection1.trace', function(){        // Import the record
            Bond.replayAt("deflectBall");                                       // Switch to replay mode
            game.deflectBall(null, null);                                       // Call the function to be replayed
            test.ok(Bond.seen("deflectTowardTangent", {byAdding: '-0.23pi'}));  // Test we get the expected result
            test.done();
        });

    }
};
