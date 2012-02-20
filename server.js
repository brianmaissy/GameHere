var express = require("express");
var ejs = require("ejs");

var app = express.createServer();
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

app.post('/', function(req, res){
    xPos = req.body.pos['x'];
    yPos = req.body.pos['y'];
    res.render('index', {
        x: xPos,
        y: yPos
    });
});

app.listen(8888);
