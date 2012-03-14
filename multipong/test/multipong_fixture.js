var multipong = require("../multipong");

exports.testSomething = function(test){
    test.expect(1);
    test.equal(Math.PI/2, 0);

    test.done();
};

exports.testSomethingElse = function(test){
    test.ok(false, "this assertion should fail");
    test.done();
};
