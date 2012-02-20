var express = require("express");
var ejs = require("ejs");

var app = express.createServer();
app.configure(function() {
    app.use(express.bodyParser());
    app.use(express.static('./static/'));
    app.use(app.router);
});
app.set('view engine', 'ejs');
app.set('view options', {
    layout: false
});
app.use(express.bodyParser());

var xPos = 0;
var yPos = 0;

app.get('/', function(req, res){
    res.render('index', {
        x: xPos,
        y: yPos
    });
});

app.post('/input', function(req, res){
    xPos += 10*parseInt(req.param('x', 0));
    yPos += 10*parseInt(req.param('y', 0));
    res.render('update', {
        x: xPos,
        y: yPos
    });
});

app.listen(8888);
